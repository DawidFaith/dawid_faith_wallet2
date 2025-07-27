// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract WeeklyTokenStaking is ReentrancyGuard {
    IERC20 public immutable stakingToken;   // 0 Decimals (D.INVEST)
    IERC20 public immutable rewardToken;    // 2 Decimals (D.FAITH)

    uint256 public constant WEEK = 7 days;
    uint256 public constant MIN_CLAIM_AMOUNT = 1; // 0.01 D.FAITH (1 wei = 0.01 token with 2 decimals)
    
    uint256 public totalStaked;
    uint256 public totalRewardsDistributed;

    struct StakeInfo {
        uint256 amount;
        uint256 lastRewardUpdate;
        uint256 stakeTimestamp;
        uint256 accumulatedRewards;
    }

    struct RewardStage {
        uint256 maxTotalDistributed;
        uint256 rewardRatePercent; // Rate pro Woche in Prozent (10 = 10%)
    }

    RewardStage[] public stages;
    mapping(address => StakeInfo) public stakers;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 reward);

    constructor(address _stakingToken, address _rewardToken) {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_stakingToken != _rewardToken, "Tokens must be different");

        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);

        // Halving Stages: 10% -> 5% -> 2.5% -> 1.25% -> 0.625% -> 0.3125%
        stages.push(RewardStage(10000 * 100, 10));     // 0-10,000 D.FAITH: 10%
        stages.push(RewardStage(20000 * 100, 5));      // 10,000-20,000: 5%
        stages.push(RewardStage(40000 * 100, 250));    // 20,000-40,000: 2.5% (250 = 2.5 * 100)
        stages.push(RewardStage(60000 * 100, 125));    // 40,000-60,000: 1.25%
        stages.push(RewardStage(80000 * 100, 63));     // 60,000-80,000: 0.625% (rounded)
        stages.push(RewardStage(type(uint256).max, 31)); // 80,000+: 0.31%
    }

    function getCurrentRewardRate() public view returns (uint256) {
        for (uint i = 0; i < stages.length; i++) {
            if (totalRewardsDistributed < stages[i].maxTotalDistributed) {
                return stages[i].rewardRatePercent;
            }
        }
        return stages[stages.length - 1].rewardRatePercent;
    }

    function getCurrentStage() public view returns (uint8) {
        for (uint8 i = 0; i < stages.length; i++) {
            if (totalRewardsDistributed < stages[i].maxTotalDistributed) {
                return i + 1;
            }
        }
        return uint8(stages.length);
    }

    function _updateRewards(address _user) internal {
        StakeInfo storage user = stakers[_user];
        if (user.amount == 0 || user.lastRewardUpdate == 0) {
            return;
        }

        uint256 timeElapsed = block.timestamp - user.lastRewardUpdate;
        if (timeElapsed > 0) {
            uint256 rewardRate = getCurrentRewardRate();
            
            // Berechne Rewards pro Sekunde
            // Formula: (stakedAmount * rewardRate) / 604800 pro Sekunde
            // stakedAmount hat 0 decimals, rewardRate ist in %, Ergebnis hat 2 decimals
            uint256 rewardPerSecond = (user.amount * rewardRate) / 604800; // 604800 = seconds per week
            uint256 newRewards = rewardPerSecond * timeElapsed;
            
            user.accumulatedRewards += newRewards;
            user.lastRewardUpdate = block.timestamp;
        }
    }

    function stake(uint256 _amount) external nonReentrant {
        require(_amount > 0, "Amount must be > 0");
        require(stakingToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        StakeInfo storage user = stakers[msg.sender];

        // Update rewards before changing stake amount
        _updateRewards(msg.sender);

        if (user.amount == 0) {
            user.stakeTimestamp = block.timestamp;
            user.lastRewardUpdate = block.timestamp;
        }

        user.amount += _amount;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    function unstake(uint256 _amount) external nonReentrant {
        StakeInfo storage user = stakers[msg.sender];
        require(user.amount >= _amount, "Not enough tokens staked");
        require(_amount > 0, "Amount must be > 0");

        // Update rewards first
        _updateRewards(msg.sender);

        user.amount -= _amount;
        totalStaked -= _amount;

        // If unstaking everything, reset user data
        if (user.amount == 0) {
            user.lastRewardUpdate = 0;
            user.stakeTimestamp = 0;
        } else {
            user.lastRewardUpdate = block.timestamp;
        }

        require(stakingToken.transfer(msg.sender, _amount), "Transfer failed");
        emit Unstaked(msg.sender, _amount);
    }

    function claimReward() external nonReentrant {
        StakeInfo storage user = stakers[msg.sender];
        require(user.amount > 0, "Nothing staked");

        // Update rewards to current time
        _updateRewards(msg.sender);

        uint256 reward = user.accumulatedRewards;
        require(reward >= MIN_CLAIM_AMOUNT, "Minimum claim amount not reached");
        require(rewardToken.balanceOf(address(this)) >= reward, "Insufficient reward tokens");

        user.accumulatedRewards = 0;
        totalRewardsDistributed += reward;

        require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
        emit RewardClaimed(msg.sender, reward);
    }

    // View Functions
    function getClaimableReward(address _user) external view returns (uint256) {
        StakeInfo storage user = stakers[_user];
        if (user.amount == 0 || user.lastRewardUpdate == 0) {
            return user.accumulatedRewards;
        }

        uint256 timeElapsed = block.timestamp - user.lastRewardUpdate;
        uint256 rewardRate = getCurrentRewardRate();
        uint256 rewardPerSecond = (user.amount * rewardRate) / 604800;
        uint256 pendingRewards = rewardPerSecond * timeElapsed;

        return user.accumulatedRewards + pendingRewards;
    }

    // Detaillierte Reward-Anzeige für UI
    function getDetailedRewardInfo(address _user) external view returns (
        uint256 claimableReward,           // Normale claimable rewards (2 decimals)
        uint256 nextClaimTimestamp,        // Timestamp wann nächster Claim möglich ist
        uint256 hoursPerClaimTimes10,      // Stunden pro 0.01 D.FAITH * 10 (für 1 Dezimalstelle)
        uint256 currentRatePercent,        // Aktuelle Rate in Prozent
        bool canClaimNow                   // Kann jetzt claimen?
    ) {
        StakeInfo storage user = stakers[_user];
        
        // Standard claimable rewards (2 decimals)
        claimableReward = this.getClaimableReward(_user);
        canClaimNow = claimableReward >= MIN_CLAIM_AMOUNT;
        currentRatePercent = getCurrentRewardRate();
        
        if (user.amount == 0) {
            return (claimableReward, 0, type(uint256).max, currentRatePercent, canClaimNow);
        }
        
        // Berechne wie lange es dauert, 1 wei (0.01 D.FAITH) zu verdienen
        // Anstatt rewardPerSecond zu berechnen, nutzen wir direkte Division
        if (user.amount > 0 && currentRatePercent > 0) {
            // Zeit für 1 wei: 604800 / (amount * rate)
            uint256 secondsFor001DFAITH = 604800 / (user.amount * currentRatePercent);
            // Stunden mit 1 Dezimalstelle: (seconds * 10) / 3600
            hoursPerClaimTimes10 = (secondsFor001DFAITH * 10) / 3600;
            
            // Berechne Timestamp wann nächster Claim möglich ist
            if (canClaimNow) {
                nextClaimTimestamp = block.timestamp; // Sofort möglich
            } else {
                uint256 remainingWei = MIN_CLAIM_AMOUNT - claimableReward;
                // Zeit für remaining wei: (remainingWei * 604800) / (amount * rate)
                uint256 secondsToNextClaim = (remainingWei * 604800) / (user.amount * currentRatePercent);
                nextClaimTimestamp = block.timestamp + secondsToNextClaim;
            }
        } else {
            nextClaimTimestamp = 0; // Nie möglich
            hoursPerClaimTimes10 = type(uint256).max;
        }
    }

    function getUserInfo(address _user) external view returns (
        uint256 stakedAmount,
        uint256 claimableReward,
        uint256 stakeTimestamp,
        bool canUnstake,
        bool canClaim
    ) {
        StakeInfo storage user = stakers[_user];
        stakedAmount = user.amount;
        claimableReward = this.getClaimableReward(_user);
        stakeTimestamp = user.stakeTimestamp;
        
        canUnstake = user.amount > 0; // Jederzeit möglich wenn Token gestaked sind
        canClaim = claimableReward >= MIN_CLAIM_AMOUNT;
    }

    function getContractInfo() external view returns (
        uint256 totalStakedTokens,
        uint256 rewardBalance,
        uint8 currentStage,
        uint256 currentRate
    ) {
        totalStakedTokens = totalStaked;
        rewardBalance = rewardToken.balanceOf(address(this));
        currentStage = getCurrentStage();
        currentRate = getCurrentRewardRate();
    }
}
