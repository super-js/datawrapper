import {DataWrapper} from './index';

describe('Datawrapper', () => {
    it('should connect', async () => {
        const dataWrapper = new DataWrapper({
            host: 'localhost',
            port: 27017,
            db: 'kiddykit',
        });

        await dataWrapper.connect({
            modelsDirPath: __dirname
        });

        expect(dataWrapper.isConnected()).toBe(true);
    });
});
