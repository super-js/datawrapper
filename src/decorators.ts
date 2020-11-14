import {Column, ColumnOptions} from "typeorm";

export const UniqueColumn = (columnOptions: ColumnOptions = {}) => Column({unique: true, ...columnOptions});