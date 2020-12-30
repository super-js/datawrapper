import {PrimaryGeneratedColumn} from "typeorm";
import {BaseDataWrapperEntity} from "./BaseDataWrapperEntity";
export abstract class DataWrapperEntity extends BaseDataWrapperEntity {

    @PrimaryGeneratedColumn()
    id: number;

}