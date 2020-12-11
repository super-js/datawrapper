import {QueryRunner, Connection} from "typeorm";

export class DataWrapperTransaction {

    _queryRunner: QueryRunner;

    _setQueryRunner(queryRunner) {
        this._queryRunner = queryRunner;
    }

    _release(): Promise<void> {
        if(this._queryRunner) return this._queryRunner.release();

    }

    static async startTransaction(connection: Connection): Promise<DataWrapperTransaction> {
        const transaction = new DataWrapperTransaction();
        transaction._setQueryRunner(await connection.createQueryRunner());
        await transaction.start();
        return transaction;
    }

    async start(): Promise<void> {
        if(this._queryRunner) {
            await this._queryRunner.startTransaction();
        }
    }

    async commit(): Promise<void> {
        if(this._queryRunner) {
            await this._queryRunner.commitTransaction();
            return this._release();
        }
    }

    async rollback(): Promise<void> {
        if(this._queryRunner) {
            await this._queryRunner.rollbackTransaction();
            return this._release();
        }
    }

    get isTransactionActive(): boolean {
        return this._queryRunner && this._queryRunner.isTransactionActive;
    }

    getQueryRunner(): QueryRunner {
        return this._queryRunner;
    }
}