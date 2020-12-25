pragma solidity 0.6.0;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../contracts/ZUSDImplementation.sol"; // Workaround Truffle duplicate artifacts different paths issues

/**
 * @title ZUSDIssuer
 * @dev This contract will be the issuer for ZUSD. It provides a check and balance on
 * token issuance by requiring mints to be first proposed and a certain number of blocks
 * to have passed before it can be executed. This gives other issuers a time to check
 * that the issuance is valid and if not, reject the mint.
 */
contract ZUSDIssuer {
    using SafeMath for uint256;

    // IMPLEMENTATION
    ZUSDImplementation public implementation;
    event ImplementationChange(
        address oldImplementation,
        address newImplementation
    );

    // MEMBERSHIP DATA
    mapping(address => bool) internal _members;
    uint256 public numMembers;
    event AddMember(address indexed member);
    event RemoveMember(address indexed member);

    // WAIT TIME
    uint256 public mintWaitBlocks;
    event MintWaitBlocksUpdated(
        uint256 oldMintWaitBlocks,
        uint256 newMintWaitBlocks
    );

    // PENDING TXS
    struct PendingMint {
        address recipient;
        uint256 value;
        uint256 canMintAtBlock;
    }
    // NOTE: pendingMints is public and will generate a getter automatically
    // Current solidity version does not support returning structs so we fall back to this
    mapping(uint256 => PendingMint) public pendingMints;
    uint256 public pendingMintsIndex;
    event MintProposed(address indexed proposer, uint256 pendingMintsIndex);
    event MintSent(address indexed sender, uint256 pendingMintsIndex);
    event MintRejected(address indexed sender, uint256 pendingMintsIndex);

    // OWNER
    address public owner;
    address public proposedOwner;
    event OwnershipTransferProposed(
        address indexed currentOwner,
        address indexed proposedOwner
    );
    event OwnershipTransferDisregarded(address indexed oldProposedOwner);
    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    // CONSTRUCTOR

    constructor(address initialImplementation, uint256 initialMintWaitBlocks)
        public
    {
        numMembers = 0;
        mintWaitBlocks = initialMintWaitBlocks;
        pendingMintsIndex = 0;
        owner = msg.sender;
        proposedOwner = address(0);
        implementation = ZUSDImplementation(initialImplementation);
    }

    // IMPLEMENTATION LOGIC

    /**
     * @dev Sets the implementation contract address.
     * @param implementationAddress The address of the implementation to point to.
     */
    function setImplementation(address implementationAddress)
        external
        onlyOwner
    {
        emit ImplementationChange(
            address(implementation),
            implementationAddress
        );
        implementation = ZUSDImplementation(implementationAddress);
    }

    // MEMBERSHIP LOGIC

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyMember() {
        require(_members[msg.sender], "onlyMember");
        _;
    }

    /**
     * @return Whether the address is a member.
     */
    function isMember(address addr) external view returns (bool) {
        return _members[addr];
    }

    /**
     * @dev Adds a new member.
     * @param addr The address to add.
     */
    function addMember(address addr) external onlyOwner {
        require(_members[addr] == false, "already a member");
        _members[addr] = true;
        numMembers = numMembers.add(1);

        emit AddMember(addr);
    }

    /**
     * @dev Removes an existing member.
     * @param addr The address to remove.
     */
    function removeMember(address addr) external onlyOwner {
        require(_members[addr] == true, "not a member");
        _members[addr] = false;
        numMembers = numMembers.sub(1);
        emit RemoveMember(addr);
    }

    // WAIT TIME

    function setMintWaitBlocks(uint256 newMintWaitBlocks)
        external
        onlyOwner
        returns (bool)
    {
        emit MintWaitBlocksUpdated(mintWaitBlocks, newMintWaitBlocks);
        mintWaitBlocks = newMintWaitBlocks;

        return true;
    }

    // MINT FUNCTIONALITY

    /**
     * @dev Creates a mint proposal that must wait mintWaitBlocks blocks before it can be executed.
     * Note that mintWaitBlocks can be zero to allow for no-wait mints.
     * @param to The recipient of the minted tokens.
     * @param value The number of tokens to mint.
     * Returns a uint256 that represents the index of the mint proposal.
     */
    function proposeMint(address to, uint256 value)
        external
        onlyMember
        returns (uint256)
    {
        pendingMints[pendingMintsIndex] = PendingMint(
            to,
            value,
            mintWaitBlocks.add(block.number)
        );
        emit MintProposed(msg.sender, pendingMintsIndex);
        uint256 proposedIndex = pendingMintsIndex;
        pendingMintsIndex = pendingMintsIndex.add(1);

        return proposedIndex;
    }

    /**
     * @dev Executes a mint proposal that has waited sufficient blocks.
     * @param index The index of the _pendingMints to execute.
     * Returns a boolean that indicates if the operation was successful.
     */
    function sendMint(uint256 index) external onlyMember returns (bool) {
        require(
            block.number >= pendingMints[index].canMintAtBlock,
            "cannot send mint until sufficient blocks have passed"
        );

        bool success =
            implementation.mintTo(
                pendingMints[index].recipient,
                pendingMints[index].value
            );

        require(
            success,
            "sending proposed mint got failure from implementation"
        );
        emit MintSent(msg.sender, index);
        delete pendingMints[index];

        return success;
    }

    /**
     * @dev Deletes the mint proposal, can be called by any issuer on any mint proposal, provides a check
     * and balance on token minting.
     * @param index The index of the _pendingMints to delete.
     * Returns a boolean that indicates if the operation was successful.
     */
    function rejectMint(uint256 index) external onlyMember returns (bool) {
        require(
            pendingMints[index].value > 0,
            "this pending mint does not exist"
        );

        emit MintRejected(msg.sender, index);
        delete pendingMints[index];

        return true;
    }

    // OWNER FUNCTIONALITY

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner, "onlyOwner");
        _;
    }

    /**
     * @dev Allows the current owner to begin transferring control of the contract to a proposedOwner
     * @param newProposedOwner The address to transfer ownership to.
     */
    function proposeOwner(address newProposedOwner) external onlyOwner {
        require(
            newProposedOwner != address(0),
            "cannot transfer ownership to address zero"
        );
        require(msg.sender != newProposedOwner, "caller already is owner");

        proposedOwner = newProposedOwner;
        emit OwnershipTransferProposed(owner, proposedOwner);
    }

    /**
     * @dev Allows the current owner or proposed owner to cancel transferring control of the contract to a proposedOwner
     */
    function disregardProposeOwner() external {
        require(
            msg.sender == proposedOwner || msg.sender == owner,
            "only proposedOwner or owner"
        );
        require(
            proposedOwner != address(0),
            "can only disregard a proposed owner that was previously set"
        );

        address oldProposedOwner = proposedOwner;
        proposedOwner = address(0);
        emit OwnershipTransferDisregarded(oldProposedOwner);
    }

    /**
     * @dev Allows the proposed owner to complete transferring control of the contract to the proposedOwner.
     */
    function claimOwnership() external {
        require(msg.sender == proposedOwner, "onlyProposedOwner");

        address oldOwner = owner;
        owner = proposedOwner;
        proposedOwner = address(0);
        emit OwnershipTransferred(oldOwner, owner);
    }
}
