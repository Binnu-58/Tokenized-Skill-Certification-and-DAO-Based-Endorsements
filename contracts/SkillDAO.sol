// SPDX-License-Identifier: MIT
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

    mapping(uint256 => Certification) public certifications;
    mapping(uint256 => Endorsement[]) public endorsements;
    mapping(address => bool) public certifiedApprovers;

    constructor() ERC721("SkillDAO", "SKLDAO") Ownable(msg.sender) {}

    function addApprover(address approver) external onlyOwner {
        certifiedApprovers[approver] = true;
    }

    function issueCertification(
        address recipient,
        string memory skillName,
        uint256 level,
        uint256 expiryDuration
    ) external {
        require(certifiedApprovers[msg.sender], "Not authorized");
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        certifications[tokenId] = Certification({
            skillName: skillName,
            level: level,
            certifier: msg.sender,
            issueDate: block.timestamp,
            expiryDate: block.timestamp + expiryDuration
        });
        
        _mint(recipient, tokenId);
    }

    function addEndorsement(
        uint256 tokenId,
        uint256 weight,
        string memory comment
    ) external {
        require(ownerOf(tokenId) != msg.sender, "Cannot endorse yourself");
        endorsements[tokenId].push(Endorsement({
            endorser: msg.sender,
            weight: weight,
            comment: comment,
            timestamp: block.timestamp
        }));
    }

    function revokeCertification(uint256 tokenId) external onlyOwner {
        _burn(tokenId);
        delete certifications[tokenId];
    }

    function getEndorsementCount(uint256 tokenId) public view returns (uint256) {
        return endorsements[tokenId].length;
    }
}
