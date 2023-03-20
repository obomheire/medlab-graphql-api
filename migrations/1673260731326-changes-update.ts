import { MigrationInterface, QueryRunner } from "typeorm";

export class changesUpdate1673260731326 implements MigrationInterface {
    name = 'changesUpdate1673260731326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`visit\` (\`id\` varchar(36) NOT NULL, \`uniqueCode\` varchar(255) NOT NULL, \`visitNote\` varchar(255) NULL, \`allergy\` json NULL, \`vitalSigns\` json NULL, \`assessmentLog\` json NULL, \`recommendation\` json NULL, \`doctorNote\` json NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`patientId\` varchar(36) NULL, \`doctorId\` varchar(36) NULL, UNIQUE INDEX \`IDX_ad4b5e7fd0bf9aaa4e9fb8055b\` (\`uniqueCode\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patient\` (\`id\` varchar(36) NOT NULL, \`firstName\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`middleName\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`phoneNumber\` varchar(255) NULL, \`residentialAddress\` text NULL, \`permanentAddress\` text NULL, \`nextOfKin\` text NULL, \`payerDetails\` text NULL, \`religion\` varchar(255) NULL, \`occupation\` varchar(255) NULL, \`admissionStatus\` enum ('PENDING', 'ADMITTED', 'DISCHARGED', 'OUTPATIENT', 'DEAD', 'EMERGENCY') NOT NULL DEFAULT 'OUTPATIENT', \`language\` varchar(255) NULL, \`bloodGroup\` enum ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE') NULL, \`genotype\` enum ('AA', 'AS', 'SS', 'AC', 'CC', 'SC') NULL, \`unique\` varchar(255) NOT NULL, \`reasonForDeath\` varchar(255) NULL, \`dateOfBirth\` varchar(255) NULL, \`nationality\` varchar(255) NULL, \`profilePicture\` varchar(255) NULL, \`maritalStatus\` enum ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED', 'ENGAGED') NOT NULL, \`dischargeDates\` text NULL, \`admissionDates\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pharmacy_prescription\` (\`id\` varchar(36) NOT NULL, \`items\` text NULL, \`uniqueCode\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'DECLINED', 'DISPENSED', 'ONGOING') NOT NULL DEFAULT 'PENDING', \`totalCost\` int NULL, \`isPaid\` tinyint NOT NULL DEFAULT 0, \`isRefill\` tinyint NOT NULL DEFAULT 0, \`isDispensed\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`patientId\` varchar(36) NULL, \`visitId\` varchar(36) NULL, \`doctorId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`investigation_entity\` (\`id\` varchar(36) NOT NULL, \`notes\` varchar(255) NULL, \`code\` varchar(255) NOT NULL, \`status\` enum ('PENDING', 'COMPLETED', 'CANCELLED', 'ONGOING') NOT NULL DEFAULT 'PENDING', \`result\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`testId\` varchar(36) NULL, \`doctorId\` varchar(36) NULL, \`patientId\` varchar(36) NULL, \`visitId\` varchar(36) NULL, UNIQUE INDEX \`IDX_59926921d67dcaf34e683dac10\` (\`code\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD CONSTRAINT \`FK_0f994812406b1deb208e79c0b30\` FOREIGN KEY (\`patientId\`) REFERENCES \`patient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD CONSTRAINT \`FK_426fe8965f87aa612e10c691968\` FOREIGN KEY (\`doctorId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pharmacy_prescription\` ADD CONSTRAINT \`FK_b9ee8cf5290434102e3763b7148\` FOREIGN KEY (\`patientId\`) REFERENCES \`patient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pharmacy_prescription\` ADD CONSTRAINT \`FK_13702a41d67b2e48a66856e615b\` FOREIGN KEY (\`visitId\`) REFERENCES \`visit\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pharmacy_prescription\` ADD CONSTRAINT \`FK_018e612b5aad5365bf0309187f8\` FOREIGN KEY (\`doctorId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` ADD CONSTRAINT \`FK_29d54b6ce3c4cc11601fa35281e\` FOREIGN KEY (\`testId\`) REFERENCES \`test\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` ADD CONSTRAINT \`FK_7a936d105ce4f17e9e71b9c461c\` FOREIGN KEY (\`doctorId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` ADD CONSTRAINT \`FK_499853f078eec1194ba4a9978da\` FOREIGN KEY (\`patientId\`) REFERENCES \`patient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` ADD CONSTRAINT \`FK_b03e86485d64bf948df59723b5a\` FOREIGN KEY (\`visitId\`) REFERENCES \`visit\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` DROP FOREIGN KEY \`FK_b03e86485d64bf948df59723b5a\``);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` DROP FOREIGN KEY \`FK_499853f078eec1194ba4a9978da\``);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` DROP FOREIGN KEY \`FK_7a936d105ce4f17e9e71b9c461c\``);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` DROP FOREIGN KEY \`FK_29d54b6ce3c4cc11601fa35281e\``);
        await queryRunner.query(`ALTER TABLE \`pharmacy_prescription\` DROP FOREIGN KEY \`FK_018e612b5aad5365bf0309187f8\``);
        await queryRunner.query(`ALTER TABLE \`pharmacy_prescription\` DROP FOREIGN KEY \`FK_13702a41d67b2e48a66856e615b\``);
        await queryRunner.query(`ALTER TABLE \`pharmacy_prescription\` DROP FOREIGN KEY \`FK_b9ee8cf5290434102e3763b7148\``);
        await queryRunner.query(`ALTER TABLE \`visit\` DROP FOREIGN KEY \`FK_426fe8965f87aa612e10c691968\``);
        await queryRunner.query(`ALTER TABLE \`visit\` DROP FOREIGN KEY \`FK_0f994812406b1deb208e79c0b30\``);
        await queryRunner.query(`DROP INDEX \`IDX_59926921d67dcaf34e683dac10\` ON \`investigation_entity\``);
        await queryRunner.query(`DROP TABLE \`investigation_entity\``);
        await queryRunner.query(`DROP TABLE \`pharmacy_prescription\``);
        await queryRunner.query(`DROP TABLE \`patient\``);
        await queryRunner.query(`DROP INDEX \`IDX_ad4b5e7fd0bf9aaa4e9fb8055b\` ON \`visit\``);
        await queryRunner.query(`DROP TABLE \`visit\``);
    }

}
