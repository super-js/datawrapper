import {Column} from "typeorm";
import {DataWrapperEntityWithCode} from "./DataWrapperEntityWithCode";

export abstract class DataWrapperEntityWithCodeNameDesc extends DataWrapperEntityWithCode {

    @Column()
    name: string;

    @Column({nullable: true})
    description: string;

}