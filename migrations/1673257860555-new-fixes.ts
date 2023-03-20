import { MigrationInterface, QueryRunner } from "typeorm";

export class newFixes1673257860555 implements MigrationInterface {
    name = 'newFixes1673257860555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_79d896858972e3fce4fd433add\` ON \`visit\``);
        await queryRunner.query(`ALTER TABLE \`visit\` DROP COLUMN \`unique\``);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD \`uniqueCode\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD UNIQUE INDEX \`IDX_ad4b5e7fd0bf9aaa4e9fb8055b\` (\`uniqueCode\`)`);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD \`doctorId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`patient\` CHANGE \`admissionStatus\` \`admissionStatus\` enum ('PENDING', 'ADMITTED', 'DISCHARGED', 'OUTPATIENT', 'DEAD', 'EMERGENCY') NOT NULL DEFAULT 'OUTPATIENT'`);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` CHANGE \`status\` \`status\` enum ('PENDING', 'COMPLETED', 'CANCELLED', 'ONGOING') NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD CONSTRAINT \`FK_426fe8965f87aa612e10c691968\` FOREIGN KEY (\`doctorId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`visit\` DROP FOREIGN KEY \`FK_426fe8965f87aa612e10c691968\``);
        await queryRunner.query(`ALTER TABLE \`investigation_entity\` CHANGE \`status\` \`status\` enum ('PENDING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING'`);
        await queryRunner.query(`ALTER TABLE \`patient\` CHANGE \`admissionStatus\` \`admissionStatus\` enum ('PENDING', 'ADMITTED', 'DISCHARGED', 'OUTPATIENT', 'DEAD') NOT NULL DEFAULT 'OUTPATIENT'`);
        await queryRunner.query(`ALTER TABLE \`visit\` DROP COLUMN \`doctorId\``);
        await queryRunner.query(`ALTER TABLE \`visit\` DROP INDEX \`IDX_ad4b5e7fd0bf9aaa4e9fb8055b\``);
        await queryRunner.query(`ALTER TABLE \`visit\` DROP COLUMN \`uniqueCode\``);
        await queryRunner.query(`ALTER TABLE \`visit\` ADD \`unique\` varchar(255) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_79d896858972e3fce4fd433add\` ON \`visit\` (\`unique\`)`);
    }

}
