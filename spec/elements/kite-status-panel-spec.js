'use strict';

const {withKite, withKiteRoutes} = require('kite-api/test/helpers/kite');
const {fakeResponse} = require('kite-connector/test/helpers/http');
const {click} = require('../helpers/events');

describe('KiteStatusPanel', () => {

  let status, app, jasmineContent, workspaceElement, notificationsPkg;

  beforeEach(() => {
    jasmineContent = document.querySelector('#jasmine-content');
    workspaceElement = atom.views.getView(atom.workspace);

    jasmineContent.appendChild(workspaceElement);
    jasmine.useRealClock();

    waitsForPromise(() => atom.packages.activatePackage('notifications').then(pkg => {
      notificationsPkg = pkg.mainModule;
      notificationsPkg.initializeIfNotInitialized();
    }));

    waitsForPromise(() => atom.packages.activatePackage('kite').then(pkg => {
      app = pkg.mainModule.app;
      status = pkg.mainModule.getStatusPanel();

      document.body.appendChild(status);
    }));
  });

  afterEach(() => {
    notificationsPkg.lastNotification = null;
    atom.notifications.clear();
    delete status.starting;
    delete status.installing;
  });

  withKite({reachable: true}, () => {
    it('displays the icon', () => {
      waitsForPromise(() => status.show().then(() => {
        expect(status.querySelector('.split-line .left kite-logo')).toExist();
      }));
    });

    it('displays a link to the user account', () => {
      waitsForPromise(() => status.show().then(() => {
        const link = status.querySelector('.split-line .right a');
        expect(link).toExist();
        expect(link.textContent).toEqual('Account');
        expect(link.href).toEqual('http://localhost:46624/clientapi/desktoplogin?d=/settings/acccount');
      }));
    });
  });

  withKite({reachable: true}, () => {
    withKiteRoutes([
      [o => o.path === '/clientapi/user', o => fakeResponse(401)],
    ]);

    beforeEach(() => {
      waitsForPromise(() => status.show());
    });

    it('displays an action to log into kited', () => {
      const state = status.querySelector('.status');

      const button = state.querySelector('a');

      expect(button.href).toEqual('kite-atom-internal://login');
      expect(button.textContent).toEqual('Login now');
    });

    describe('clicking on the button', () => {
      it('displays the kite login', () => {
        const button = status.querySelector('a.btn');

        spyOn(app, 'login');
        click(button);

        expect(app.login).toHaveBeenCalled();
      });

      it('closes the status panel', () => {
        const button = status.querySelector('a.btn');

        spyOn(app, 'login');
        click(button);

        expect(status.parentNode).toBeNull();
      });
    });
  });

  withKite({running: false}, () => {
    beforeEach(() => {
      waitsForPromise(() => status.show());
    });

    it('displays an action to start kited', () => {
      const state = status.querySelector('.status');

      expect(state.querySelector('.text-danger').textContent)
      .toEqual('Kite engine is not running •');

      const button = state.querySelector('a');

      expect(button.href).toEqual('kite-atom-internal://start');
      expect(button.textContent).toEqual('Launch now');
    });

    describe('clicking on the button', () => {
      it('starts kited', () => {
        const button = status.querySelector('a.btn');

        spyOn(app, 'start').andReturn(Promise.resolve());
        click(button);

        expect(app.start).toHaveBeenCalled();
      });
    });
  });

  withKite({
    running: false,
    allInstallPaths: [
      '/path/to/app',
      '/path/to/app2',
    ],
  }, () => {
    beforeEach(() => {
      waitsForPromise(() => status.show());
    });

    it('does not display an action to start kited', () => {
      const state = status.querySelector('.status');

      expect(state.querySelector('.text-danger').textContent.replace(/\s+/g, ' '))
      .toEqual(`Kite engine is not running •
        You have multiple versions of Kite installed.
        Please launch your desired one.`.replace(/\s+/g, ' '));

      const button = state.querySelector('a');

      expect(button).toBeNull();
    });
  });

  withKite({runningEnterprise: false}, () => {
    beforeEach(() => {
      waitsForPromise(() => status.show().catch(err => console.log(err)));
    });

    it('displays an action to start kited', () => {
      const state = status.querySelector('.status');

      expect(state.querySelector('.text-danger').textContent)
      .toEqual('Kite engine is not running •');

      const button = state.querySelector('a');

      expect(button.href).toEqual('kite-atom-internal://start-enterprise');
      expect(button.textContent).toEqual('Launch now');
    });

    describe('clicking on the button', () => {
      it('starts kited', () => {
        const button = status.querySelector('a.btn');

        spyOn(app, 'startEnterprise').andReturn(Promise.resolve());
        click(button);

        expect(app.startEnterprise).toHaveBeenCalled();
      });
    });
  });

  withKite({
    running: false,
    runningEnterprise: false,
  }, () => {
    beforeEach(() => {
      waitsForPromise(() => status.show());
    });

    it('displays an action to start kited', () => {
      const state = status.querySelector('.status');

      expect(state.querySelector('.text-danger').textContent.replace(/\s+/g, ' '))
      .toEqual('Kite engine is not running • Which version of kite do you want to launch?');

      const buttons = state.querySelectorAll('a');

      expect(buttons.length).toEqual(2);

      expect(buttons[0].href).toEqual('kite-atom-internal://start-enterprise');
      expect(buttons[0].textContent).toEqual('Launch Kite Enterprise');
      expect(buttons[1].href).toEqual('kite-atom-internal://start');
      expect(buttons[1].textContent).toEqual('Launch Kite cloud');
    });

    describe('clicking on the enterprise button', () => {
      it('starts kited', () => {
        const button = status.querySelector('a.btn');

        spyOn(app, 'startEnterprise').andReturn(Promise.resolve());
        click(button);

        expect(app.startEnterprise).toHaveBeenCalled();
      });
    });

    describe('clicking on the cloud button', () => {
      it('starts kited', () => {
        const button = status.querySelectorAll('a.btn')[1];

        spyOn(app, 'start').andReturn(Promise.resolve());
        click(button);

        expect(app.start).toHaveBeenCalled();
      });
    });
  });

  withKite({
    running: false,
    runningEnterprise: false,
    allInstallPaths: ['/path/to/app', '/path/to/app2'],
    allEnterpriseInstallPaths: ['/path/to/enterprise/app', '/path/to/enterprise/app2'],
  }, () => {
    beforeEach(() => {
      waitsForPromise(() => status.show());
    });

    it('does not display an action to start kited', () => {
      const state = status.querySelector('.status');

      expect(state.querySelector('.text-danger').textContent.replace(/\s+/g, ' '))
      .toEqual(`Kite engine is not running •
        You have multiple versions of Kite installed.
        Please launch your desired one.`.replace(/\s+/g, ' '));

      const button = state.querySelector('a');

      expect(button).toBeNull();
    });
  });
});
