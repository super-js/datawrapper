declare module NodeJS {
    export interface Global {
        __DATE_FORMAT: string;
        __DATETIME_FORMAT: string;
    }
}