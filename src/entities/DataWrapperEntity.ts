import {PrimaryGeneratedColumn} from "typeorm";
import {BaseDataWrapperEntity, ISaveOptions} from "./BaseDataWrapperEntity";
import {DeepPartial} from "typeorm/common/DeepPartial";

export abstract class DataWrapperEntity extends BaseDataWrapperEntity {

    @PrimaryGeneratedColumn()
    id: number;

    async update<T extends DataWrapperEntity>(updateObject: DeepPartial<T>, saveOptions?: ISaveOptions): Promise<void> {
        const {transaction, ..._saveOptions} = saveOptions || {};


        const queryBuilder = (this as any).constructor.createQueryBuilder();
        if(transaction && transaction.isTransactionActive) queryBuilder.setQueryRunner(transaction.getQueryRunner());

        await queryBuilder
            .update(updateObject)
            .where({id: this.id})
            .execute();

        await this.reload();
    }
}