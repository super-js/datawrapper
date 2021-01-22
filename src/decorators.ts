import {Column, ColumnOptions} from "typeorm";
import moment from "moment";

export const UniqueColumn = (columnOptions: ColumnOptions = {}) => Column({unique: true, ...columnOptions});
export const DateColumn = (columnOptions: ColumnOptions = {}) => Column({
    type: 'date',
    transformer : {
        to: value => value,
        from: value => moment(value).format(global.__DATE_FORMAT || 'DD/MM/YYYY')
    },
    ...columnOptions
});
export const DateTimeColumn = (columnOptions: ColumnOptions = {}) => Column({
    type: 'timestamptz',
    transformer : {
        to: value => value,
        from: value => moment(value).format(global.__DATETIME_FORMAT || 'DD/MM/YYYY H:mm')
    },
    ...columnOptions
});