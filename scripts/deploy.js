const hre = require("hardhat");

async function main() {
  const SkillDAO = await hre.ethers.getContractFactory("SkillDAO");
  const skillDAO = await SkillDAO.deploy();

  await skillDAO.deployed();

  console.log(
    `SkillDAO deployed to Core Blockchain at address: ${skillDAO.address}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
