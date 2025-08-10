import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateItineraryAndTicketTables1754814570308
  implements MigrationInterface
{
  name = 'CreateItineraryAndTicketTables1754814570308';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "itineraries" ("id" SERIAL NOT NULL, "name" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_9c5db87d0f85f56e4466ae09a38" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tickets" ("id" SERIAL NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL, "details" jsonb, "position" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "itinerary_id" integer NOT NULL, CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_itinerary" ON "tickets" ("itinerary_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "FK_e0568e8b6e3c47e367cab342fa3" FOREIGN KEY ("itinerary_id") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "FK_e0568e8b6e3c47e367cab342fa3"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_itinerary"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP TABLE "itineraries"`);
  }
}
