// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

import "./interfaceAndLibs.sol";

contract Tasks{
    address internal _owner;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
    
    IERC20Token IERC = IERC20Token(cUsdTokenAddress);
    
    // intial values
    uint internal TasksLength = 0;
    uint16 internal LockPercent = 15;
    
    // define task states
    uint8 internal Active = 0;
    uint8 internal Locked = 1;
    uint8 internal Completed = 2;
    uint8 internal Annuled = 3;
    
    struct Task {
        address payable creator;
        address payable lockOwner;
        string taskDescription;
        string proofDescription;
        string communications;
        uint bounty;
        uint lockDurationInHours;
        uint lockStartTime;
        uint lockCost;
        uint8 state;
    }
    
    mapping (uint => Task) internal tasks;
    
    using SafeMath for uint256;
    using SafeMath for uint16;
    
    // set owner when contract is deployed
    constructor(){
        _owner = msg.sender;
    }
    
    
    // Some self explanatory modifiers
    modifier onlyOwner() {
        require(msg.sender == _owner);
        _;
    }
    modifier onlyTaskOwner(uint _id){
        require(tasks[_id].creator == msg.sender);
        _;
    }
    
    modifier notTaskOwner(uint _id){
        require(tasks[_id].creator != msg.sender);
        _;
    }
    
    modifier taskIsModifiable(uint _id){
        require(tasks[_id].state != Completed || tasks[_id].state != Annuled);
        _;
    }
    
    modifier taskIsUnlocked(uint _id){
        require(tasks[_id].state == Active);
        _;
    }
    
    // define some events to update the UI
    event TaskCompleted(
        uint indexed taskid,
        address indexed completer
    );
    
    event StateChanged();
    
    
    function _lockHasExpired(uint _id) private view returns (bool){
        /* checks whether the lock time has elapsed*/
        require(tasks[_id].state == Locked);
        return (tasks[_id].lockStartTime.add(tasks[_id].lockDurationInHours) <= block.timestamp);
    }
    
    function lockTask(uint _id) external taskIsModifiable(_id) taskIsUnlocked(_id) notTaskOwner(_id) payable{
        /* users that are not the owners of the tasks can lock tasks after paying for them */
        
        // pay for the lock first
        require(
            IERC.transferFrom(
                msg.sender,
                _owner,
                tasks[_id].lockCost
            ),
            "Could not disburse funds"
        );
        tasks[_id].state = Locked;
        tasks[_id].lockStartTime = block.timestamp;
        tasks[_id].lockOwner = payable(msg.sender);
        emit StateChanged();
    }
    
    function setBackToActive(uint _id) external onlyTaskOwner(_id) taskIsModifiable(_id){
        /*A task is only set back to active if the owner of the task hasnt received any tangible results from the person
        working on the task or the task is not verifiable as completed per the proof and the lock duration has expired*/
        
        if (_lockHasExpired(_id)){
            tasks[_id].state = Active;
            tasks[_id].lockStartTime = 0;
            tasks[_id].lockOwner = payable(address(0));
            emit StateChanged();
        }else revert();
    }
    
    function completeTask(uint _id) external onlyTaskOwner(_id) taskIsModifiable(_id){
        /* pay the account that locked the task for successful completion including lock money
            only locked tasks can be completed
        */
        require(tasks[_id].state == Locked);
        uint total = tasks[_id].bounty + tasks[_id].lockCost;
        
        // Pay the locked guy and emit an event
        require(tasks[_id].lockOwner != address(0));
        require(
            IERC.transferFrom(
                _owner,
                tasks[_id].lockOwner,
                total
            ),
            "Could not disburse funds"
        );
        tasks[_id].state = Completed;
        emit TaskCompleted(_id, tasks[_id].lockOwner);
        
    }
    
    function annulTask(uint _id) external onlyTaskOwner(_id) taskIsModifiable(_id) taskIsUnlocked(_id){
        /* A task owner can choose to withdraw tasks that have no takers*/
        
        // pay back bounty to the owner of the task
        require(
            IERC.transferFrom(
                _owner,
                tasks[_id].creator,
                tasks[_id].bounty
            ),
            "Could not disburse funds"
        );
        tasks[_id].state = Annuled;
        emit StateChanged();
        
    }
    
    function addTask(
    /* add a task to the contract the prize for the task has to be paid for by the onwer on creation*/
        string memory _taskDescription,
        string memory _proofDescription,
        string memory _communications,
        uint _bounty,
        uint _duration
    ) external payable {
        
        require(
            IERC.transferFrom(
                msg.sender,
                _owner,
                _bounty
            ),
            "Could not disburse funds"
        );
        
        uint _lockcost = _bounty.mul(LockPercent).div(100);
        uint _lockstarttime = 0;
        _duration = _duration * 1 hours;
        
        tasks[TasksLength] = Task(
            payable(msg.sender),
            payable(address(0)),
            _taskDescription,
            _proofDescription,
            _communications,
            _bounty,
            _duration,
            _lockstarttime,
            _lockcost,
            Active
        );
        TasksLength++;
        emit StateChanged();
    }
    
    
    function getTaskLength() external view returns(uint){
        /* get the number of tasks that currently stored on the contract */
        return TasksLength;
    }
    
    function getTaskInfo(uint _id) external view 
        /* get the important information about a task*/
    returns(
        address payable,
        address payable,
        string memory, 
        string memory,
        string memory,
        uint,
        uint,
        uint,
        uint,
        uint8
    ){
        Task storage task = tasks[_id];
        return (
        task.creator,
        task.lockOwner,
        task.taskDescription,
        task.proofDescription,
        task.communications,
        task.bounty,
        task.lockDurationInHours,
        task.lockStartTime,
        task.lockCost,
        task.state
        );
            
    }
    
    
    function changeLockRate(uint16 percent) external onlyOwner {
        /*allows the owner of the contract to modify the lock rate */
    
        LockPercent = percent;
    }

    
    
    
}