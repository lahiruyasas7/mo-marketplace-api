import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1775291671528 implements MigrationInterface {
    name = 'Init1775291671528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" ADD "productImageUrl" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "productImageUrl"`);
    }

}
