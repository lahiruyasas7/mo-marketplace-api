import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1774844722859 implements MigrationInterface {
  name = 'Init1774844722859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" RENAME COLUMN "updatedAt" TO "expireAt"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "refresh_tokens" RENAME COLUMN "expireAt" TO "updatedAt"`,
    );
  }
}
