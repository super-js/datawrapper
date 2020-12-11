import {UniqueColumn} from "../decorators";
import {Column} from "typeorm";
import {DataWrapperEntityWithCode} from "./DataWrapperEntityWithCode";

export abstract class DataWrapperEntityWithCodeNameDesc extends DataWrapperEntityWithCode {

    @UniqueColumn()
    name: string;

    @Column({nullable: true})
    description: string;

}