import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1774894180620 implements MigrationInterface {
    name = 'Init1774894180620'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "base_price" numeric(10,2), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "variants" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "product_id" uuid NOT NULL, "combination_key" character varying(255) NOT NULL, "options" jsonb NOT NULL, "price" numeric(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "sku" character varying(100), "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_PRODUCT_COMBINATION" UNIQUE ("product_id", "combination_key"), CONSTRAINT "PK_672d13d1a6de0197f20c6babb5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e47c5ebf781644ad0b9f17c7a1" ON "variants" ("combination_key") `);
        await queryRunner.query(`ALTER TABLE "variants" ADD CONSTRAINT "FK_a9625f5484e6b6941d401ec101c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "variants" DROP CONSTRAINT "FK_a9625f5484e6b6941d401ec101c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e47c5ebf781644ad0b9f17c7a1"`);
        await queryRunner.query(`DROP TABLE "variants"`);
        await queryRunner.query(`DROP TABLE "products"`);
    }

}
