pragma solidity 0.7.5;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

/**
 * @title ZUSDImplementation
 * @dev This contract is a Pausable ERC20 token with issuance
 * controlled by a central Issuer. By implementing ZUSDImplementation
 * this contract also includes external methods for setting
 * a new implementation contract for the Proxy.
 * NOTE: The storage defined here will actually be held in the Proxy
 * contract and all calls to this contract should be made through
 * the proxy, including admin actions done as owner or issuer.
 * Any call to transfer against this contract should fail
 * since the contract is paused and there are no balances.
 */
contract ZUSDImplementation is IERC20 {
    /**
     * MATH
     */

    using SafeMath for uint256;

    /**
     * DATA
     * NOTE: Do NOT reorder any declared variables and ONLY append variables.
     * The proxy relies on existing variables to remain in the same address space.
     */

    // INITIALIZATION DATA
    bool internal _initialized = false;

    // ERC20 CONSTANT DETAILS
    string internal constant _name = "Zytara USD"; // solium-disable-line
    string internal constant _symbol = "ZUSD"; // solium-disable-line uppercase
    uint8 internal constant _decimals = 18; // solium-disable-line uppercase

    // ERC20 DATA
    mapping(address => uint256) internal _balances;
    uint256 internal _totalSupply;
    mapping(address => mapping(address => uint256)) internal _allowances;

    // OWNER DATA
    address internal _owner;
    address internal _proposedOwner;

    // PAUSABILITY DATA
    bool internal _paused = false;

    // COMPLIANCE DATA
    address internal _complianceRole;
    mapping(address => bool) internal _frozen;

    // ISSUER DATA
    address internal _issuer;

    /**
     * EVENTS
     */

    // ERC20 EVENTS
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    // OWNABLE EVENTS
    event OwnershipTransferProposed(
        address indexed currentOwner,
        address indexed proposedOwner
    );
    event OwnershipTransferDisregarded(address indexed oldProposedOwner);
    event OwnershipTransferred(
        address indexed oldOwner,
        address indexed newOwner
    );

    // PAUSABLE EVENTS
    event Pause();
    event Unpause();

    // COMPLIANCE EVENTS
    event FreezeAddress(address indexed addr);
    event UnfreezeAddress(address indexed addr);
    event WipeFrozenAddress(address indexed addr);
    event ComplianceRoleSet(
        address indexed oldComplianceRole,
        address indexed newComplianceRole
    );

    // ISSUER EVENTS
    event Mint(address indexed to, uint256 value);
    event Burn(address indexed from, uint256 value);
    event IssuerSet(address indexed oldIssuer, address indexed newIssuer);

    /**
     * FUNCTIONALITY
     */

    // INITIALIZATION FUNCTIONALITY

    /**
     * @dev sets 0 initial tokens, the owner, and the issuer.
     * this serves as the constructor for the proxy but compiles to the
     * memory model of the Implementation contract.
     */
    function initialize() public {
        require(!_initialized, "already initialized");
        _owner = msg.sender;
        _proposedOwner = address(0);
        _complianceRole = address(0);
        _totalSupply = 0;
        _issuer = msg.sender;
        _initialized = true;
    }

    /**
     * The constructor is used here to ensure that the implementation
     * contract is initialized. An uncontrolled implementation
     * contract might lead to misleading state
     * for users who accidentally interact with it.
     */
    constructor() public {
        initialize();
        pause();
    }

    // ERC20 FUNCTIONALITY

    /**
     * @return The name of the token.
     */
    function name() public pure returns (string memory) {
        return _name;
    }

    /**
     * @return The symbol of the token.
     */
    function symbol() public pure returns (string memory) {
        return _symbol;
    }

    /**
     * @return The number of decimals of the token.
     */
    function decimals() public pure returns (uint8) {
        return _decimals;
    }

    /**
     * @return The total number of tokens in existence
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    /**
     * @dev Gets the balance of the specified address.
     * @param addr The address to query the the balance of.
     * @return A uint256 representing the amount owned by the passed address.
     */
    function balanceOf(address addr) public view returns (uint256) {
        return _balances[addr];
    }

    /**
     * @dev Transfer token to a specified address from msg.sender
     * Note: the use of Safemath ensures that value is nonnegative.
     * @param to The address to transfer to.
     * @param value The amount to be transferred.
     */
    function transfer(address to, uint256 value)
        public
        whenNotPaused
        returns (bool)
    {
        _transfer(msg.sender, to, value);
        return true;
    }

    /**
     * @dev Transfer tokens from one address to another
     * @param from address The address which you want to send tokens from
     * @param to address The address which you want to transfer to
     * @param value uint256 the amount of tokens to be transferred
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public whenNotPaused returns (bool) {
        require(
            value <= _allowances[from][msg.sender],
            "insufficient allowance"
        );

        _allowances[from][msg.sender] = _allowances[from][msg.sender].sub(
            value
        );
        _transfer(from, to, value);

        return true;
    }

    /**
     * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
     * Beware that changing an allowance with this method brings the risk that someone may use both the old
     * and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
     * race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     * @param spender The address which will spend the funds.
     * @param value The amount of tokens to be spent.
     */
    function approve(address spender, uint256 value)
        public
        whenNotPaused
        returns (bool)
    {
        _approve(msg.sender, spender, value);

        return true;
    }

    /**
     * @dev Atomically increases the allowance granted to `spender` by the caller.
     * @param spender The address that will spend the tokens.
     * @param addedValue The increase in the number of tokens that can be spent.
     *
     * This mitigates the problem described in:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     */
    function increaseAllowance(address spender, uint256 addedValue)
        public
        returns (bool)
    {
        _approve(
            msg.sender,
            spender,
            _allowances[msg.sender][spender].add(addedValue)
        );
        return true;
    }

    /**
     * @dev Atomically decreases the allowance granted to `spender` by the caller.
     * @param spender The address that will spend the tokens.
     * @param subtractedValue The decrease in the number of tokens that can be spent.
     *
     * This mitigates the problem described in:
     * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
     */
    function decreaseAllowance(address spender, uint256 subtractedValue)
        public
        returns (bool)
    {
        _approve(
            msg.sender,
            spender,
            _allowances[msg.sender][spender].sub(subtractedValue)
        );
        return true;
    }

    /**
     * @dev Approve an address to spend another addresses' tokens.
     * @param owner The address that owns the tokens.
     * @param spender The address that will spend the tokens.
     * @param value The number of tokens that can be spent.
     */
    function _approve(
        address owner,
        address spender,
        uint256 value
    ) internal {
        require(!_frozen[owner] && !_frozen[spender], "address frozen");
        require(
            spender != address(0),
            "cannot approve allowance for zero address"
        );

        _allowances[owner][spender] = value;
        emit Approval(owner, spender, value);
    }

    /**
     * @dev Function to check the amount of tokens that an owner allowed to a spender.
     * @param owner address The address which owns the funds.
     * @param spender address The address which will spend the funds.
     * @return A uint256 specifying the amount of tokens still available for the spender.
     */
    function allowance(address owner, address spender)
        public
        view
        returns (uint256)
    {
        return _allowances[owner][spender];
    }

    function _transfer(
        address from,
        address to,
        uint256 value
    ) internal {
        require(to != address(0), "cannot transfer to address zero");
        require(!_frozen[from] && !_frozen[to], "address frozen");
        require(value <= _balances[from], "insufficient funds");

        _balances[from] = _balances[from].sub(value);
        _balances[to] = _balances[to].add(value);
        emit Transfer(from, to, value);
    }

    // OWNER FUNCTIONALITY

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "onlyOwner");
        _;
    }

    /**
     * @dev Current owner
     */
    function owner() public view returns (address) {
        return _owner;
    }

    /**
     * @dev Proposed new owner
     */
    function proposedOwner() public view returns (address) {
        return _proposedOwner;
    }

    /**
     * @dev Allows the current owner to begin transferring control of the contract to a proposedOwner
     * @param newProposedOwner The address to transfer ownership to.
     */
    function proposeOwner(address newProposedOwner) public onlyOwner {
        require(
            newProposedOwner != address(0),
            "cannot transfer ownership to address zero"
        );
        require(msg.sender != newProposedOwner, "caller already is owner");

        _proposedOwner = newProposedOwner;
        emit OwnershipTransferProposed(_owner, _proposedOwner);
    }

    /**
     * @dev Allows the current owner or proposed owner to cancel transferring control of the contract to a proposedOwner
     */
    function disregardProposeOwner() public {
        require(
            msg.sender == _proposedOwner || msg.sender == _owner,
            "only proposedOwner or owner"
        );
        require(
            _proposedOwner != address(0),
            "can only disregard a proposed owner that was previously set"
        );

        address oldProposedOwner = _proposedOwner;
        _proposedOwner = address(0);
        emit OwnershipTransferDisregarded(oldProposedOwner);
    }

    /**
     * @dev Allows the proposed owner to complete transferring control of the contract to the proposedOwner.
     */
    function claimOwnership() public {
        require(msg.sender == _proposedOwner, "onlyProposedOwner");

        address oldOwner = _owner;
        _owner = _proposedOwner;
        _proposedOwner = address(0);
        emit OwnershipTransferred(oldOwner, _owner);
    }

    // PAUSABILITY FUNCTIONALITY

    /**
     * @dev Pause status
     */
    function paused() public view returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not _paused.
     */
    modifier whenNotPaused() {
        require(!_paused, "whenNotPaused");
        _;
    }

    /**
     * @dev called by the owner to pause, triggers stopped state
     */
    function pause() public onlyOwner {
        require(!_paused, "already _paused");

        _paused = true;
        emit Pause();
    }

    /**
     * @dev called by the owner to unpause, returns to normal state
     */
    function unpause() public onlyOwner {
        require(_paused, "already un_paused");

        _paused = false;
        emit Unpause();
    }

    // COMPLIANCE FUNCTIONALITY

    /**
     * @dev Current compliance role
     */
    function complianceRole() public view returns (address) {
        return _complianceRole;
    }

    /**
     * @dev Gets the frozen status of the specified address.
     * @param addr The address to query the the status of.
     * @return A bool representing whether the address is frozen.
     */
    function frozen(address addr) public view returns (bool) {
        return _frozen[addr];
    }

    /**
     * @dev Sets a new compliance role address.
     * @param newComplianceRole The new address allowed to freeze/unfreeze addresses and seize their tokens.
     */
    function setComplianceRole(address newComplianceRole) public {
        require(
            msg.sender == _complianceRole || msg.sender == _owner,
            "only complianceRole or Owner"
        );

        emit ComplianceRoleSet(_complianceRole, newComplianceRole);
        _complianceRole = newComplianceRole;
    }

    modifier onlyComplianceRole() {
        require(msg.sender == _complianceRole, "onlyComplianceRole");
        _;
    }

    /**
     * @dev Freezes an address balance from being transferred.
     * @param addr The new address to freeze.
     */
    function freeze(address addr) public onlyComplianceRole {
        require(!_frozen[addr], "address already frozen");

        _frozen[addr] = true;
        emit FreezeAddress(addr);
    }

    /**
     * @dev Unfreezes an address balance allowing transfer.
     * @param addr The new address to unfreeze.
     */
    function unfreeze(address addr) public onlyComplianceRole {
        require(_frozen[addr], "address already unfrozen");

        _frozen[addr] = false;
        emit UnfreezeAddress(addr);
    }

    /**
     * @dev Wipes the balance of a frozen address, burning the tokens
     * and setting the approval to zero.
     * @param addr The new frozen address to wipe.
     */
    function wipeFrozenAddress(address addr) public onlyComplianceRole {
        require(_frozen[addr], "address is not frozen");

        uint256 _balance = _balances[addr];
        _burn(addr, _balance);
        emit WipeFrozenAddress(addr);
    }

    // ISSUER FUNCTIONALITY

    /**
     * @dev Current issuer
     */
    function issuer() public view returns (address) {
        return _issuer;
    }

    /**
     * @dev Sets a new issuer address.
     * @param newIssuer The address allowed to mint tokens to control supply.
     */
    function setIssuer(address newIssuer) public onlyOwner {
        require(newIssuer != address(0), "cannot set issuer to address zero");
        emit IssuerSet(_issuer, newIssuer);
        _issuer = newIssuer;
    }

    modifier onlyIssuer() {
        require(msg.sender == _issuer, "onlyIssuer");
        _;
    }

    /**
     * @dev Increases the total supply by minting the specified number of tokens to the issuer account.
     * @param value The number of tokens to add.
     * @return A boolean that indicates if the operation was successful.
     */
    function mint(uint256 value) public onlyIssuer returns (bool success) {
        _mint(_issuer, value);

        return true;
    }

    /**
     * @dev Increases the total supply by minting the specified number of tokens to the specified account.
     * @param value The number of tokens to add.
     * @return A boolean that indicates if the operation was successful.
     */
    function mintTo(address to, uint256 value)
        public
        onlyIssuer
        returns (bool success)
    {
        _mint(to, value);

        return true;
    }

    /**
     * @dev Internal function that mints an amount of the token and assigns it to
     * an account. This encapsulates the modification of _balances such that the
     * proper events are emitted.
     * @param to The account that will receive the created tokens.
     * @param value The amount that will be created.
     */
    function _mint(address to, uint256 value)
        internal
        onlyIssuer
        whenNotPaused
    {
        require(to != address(0), "cannot mint to address zero");
        require(!_frozen[to], "address frozen");

        _totalSupply = _totalSupply.add(value);
        _balances[to] = _balances[to].add(value);
        emit Mint(to, value);
        emit Transfer(address(0), to, value);
    }

    /**
     * @dev Decreases the total supply by burning the specified number of tokens.
     * @param value The number of tokens to remove.
     * @return A boolean that indicates if the operation was successful.
     */
    function burn(uint256 value) public returns (bool success) {
        require(!_frozen[msg.sender], "address frozen");
        require(value <= _balances[msg.sender], "insufficient funds");
        _burn(msg.sender, value);

        return true;
    }

    /**
     * @dev Decreases the total supply by burning the specified number of tokens from the specified address.
     * @param value The number of tokens to remove.
     * @return A boolean that indicates if the operation was successful.
     */
    function burnFrom(address from, uint256 value)
        public
        returns (bool success)
    {
        require(!_frozen[from] && !_frozen[msg.sender], "address frozen");
        require(value <= _balances[from], "insufficient funds");
        require(
            value <= _allowances[from][msg.sender],
            "insufficient allowance"
        );
        _burn(from, value);
        _allowances[from][msg.sender] = _allowances[from][msg.sender].sub(
            value
        );

        return true;
    }

    /**
     * @dev Internal function that burns an amount of the token of a given
     * account.
     * @param addr The account whose tokens will be burnt.
     * @param value The amount that will be burnt.
     */
    function _burn(address addr, uint256 value) internal {
        _totalSupply = _totalSupply.sub(value);
        _balances[addr] = _balances[addr].sub(value);
        emit Burn(addr, value);
        emit Transfer(addr, address(0), value);
    }
}
