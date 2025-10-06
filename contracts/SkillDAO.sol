// SPDX-License-Identifier:MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SkillDAO is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Certification {
        string skillName;
        uint256 level;
        address certifier;
        uint256 issueDate;
        uint256 expiryDate;
    }

    struct Endorsement {
        address endorser;
        uint256 weight;
        string comment;
        uint256 timestamp;
    }

    mapping(uint256 => Certification) private _certifications;
    mapping(uint256 => Endorsement[]) private _endorsements;
    mapping(address => bool) private _certifiedApprovers;

    event CertificationIssued(
        uint256 indexed tokenId,
        address indexed recipient,
        string skillName,
        uint256 level,
        address certifier,
        uint256 issueDate,
        uint256 expiryDate
    );

    event EndorsementAdded(
        uint256 indexed tokenId,
        address indexed endorser,
        uint256 weight,
        string comment,
        uint256 timestamp
    );

    event CertificationRevoked(uint256 indexed tokenId);

    constructor() ERC721("SkillDAO", "SKLDAO") Ownable() {}

    function addApprover(address approver) external onlyOwner {
        _certifiedApprovers[approver] = true;
    }

    function issueCertification(
        address recipient,
        string memory skillName,
        uint256 level,
        uint256 expiryDuration
    ) external {
        require(_certifiedApprovers[msg.sender], "Not authorized");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        _certifications[tokenId] = Certification({
            skillName: skillName,
            level: level,
            certifier: msg.sender,
            issueDate: block.timestamp,
            expiryDate: block.timestamp + expiryDuration
        });

        _mint(recipient, tokenId);

        emit CertificationIssued(
            tokenId,
            recipient,
            skillName,
            level,
            msg.sender,
            block.timestamp,
            block.timestamp + expiryDuration
        );
    }

    function addEndorsement(
        uint256 tokenId,
        uint256 weight,
        string memory comment
    ) external {
        require(_exists(tokenId), "Token does not exist");
        require(ownerOf(tokenId) != msg.sender, "Cannot endorse yourself");

        _endorsements[tokenId].push(
            Endorsement({
                endorser: msg.sender,
                weight: weight,
                comment: comment,
                timestamp: block.timestamp
            })
        );

        emit EndorsementAdded(tokenId, msg.sender, weight, comment, block.timestamp);
    }

    function revokeCertification(uint256 tokenId) external onlyOwner {
        require(_exists(tokenId), "Token does not exist");
        _burn(tokenId);
        delete _certifications[tokenId];
        emit CertificationRevoked(tokenId);
    }

    function getEndorsementCount(uint256 tokenId) external view returns (uint256) {
        return _endorsements[tokenId].length;
    }

    function getCertificationDetails(uint256 tokenId)
        external
        view
        returns (
            string memory skillName,
            uint256 level,
            address certifier,
            uint256 issueDate,
            uint256 expiryDate
        )
    {
        Certification memory cert = _certifications[tokenId];
        return (
            cert.skillName,
            cert.level,
            cert.certifier,
            cert.issueDate,
            cert.expiryDate
        );
    }

    function isCertificationValid(uint256 tokenId) external view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        Certification memory cert = _certifications[tokenId];
        return cert.expiryDate > block.timestamp;
    }
}
