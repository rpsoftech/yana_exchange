DROP SCHEMA IF EXISTS `YanaExchange` ;
CREATE SCHEMA IF NOT EXISTS `YanaExchange` ;

CREATE TABLE IF NOT EXISTS `YanaExchange`.`ChatHistory` (
  `ChatHistoryId` VARCHAR(50) NOT NULL,
  `CHRoomID` VARCHAR(50) NOT NULL,
  `Message` TEXT NOT NULL,
  `MessageFrom` ENUM('AGENT', 'BOT', 'USER') NOT NULL,
  `CHAttributes` JSON NOT NULL,
  `CHCreatedOn` INT NOT NULL,
  PRIMARY KEY (`ChatHistoryId`))
  ENGINE = InnoDB;
CREATE TABLE IF NOT EXISTS `YanaExchange`.`ChatUsers` (
  `UniqueID` VARCHAR(50) NOT NULL,
  `ChatUsersRoomID` VARCHAR(50) DEFAULT NULL,
  `ChatUsersAttributes` JSON NOT NULL,
  PRIMARY KEY (`UniqueID`))
  ENGINE = InnoDB;
  CREATE TABLE IF NOT EXISTS `YanaExchange`.`Room` (
  `RoomID` VARCHAR(50) NOT NULL,
  `RoomStatus` INT NOT NULL,
  `RoomChannelID` INT NOT NULL,
  `RoomLikeCount` INT NULL DEFAULT '0',
  `RoomAttributes` JSON NOT NULL,
  `RoomCreatedOn` INT NOT NULL,
  PRIMARY KEY (`RoomID`))
  ENGINE = InnoDB;
alter table Room add INDEX `RoomStatus` (`RoomStatus`);
alter table Room add INDEX `RoomChannelID` (`RoomChannelID`);
alter table Room add INDEX `RoomCreatedOn` (`RoomCreatedOn`);
alter table Room add INDEX `RoomLikeCount` (`RoomLikeCount`);
alter table ChatUsers add unique INDEX `ChatUsersRoomID` (`ChatUsersRoomID`);
alter table ChatHistory add unique INDEX `CHRoomID` (`CHRoomID`);
alter table ChatHistory add unique INDEX `MessageFrom` (`MessageFrom`);
alter table ChatHistory add unique INDEX `CHCreatedOn` (`CHCreatedOn`);
alter table  `ChatUsers` add FOREIGN KEY (`ChatUsersRoomID`) REFERENCES `YanaExchange`.`Room` (`RoomID`)  ON DELETE SET NULL
    ON UPDATE SET NULL;
alter table  `ChatHistory` add FOREIGN KEY (`CHRoomID`) REFERENCES `YanaExchange`.`Room` (`RoomID`) ON DELETE CASCADE
    ON UPDATE CASCADE;