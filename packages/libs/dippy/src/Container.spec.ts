/* eslint-disable jest/no-conditional-expect */
import { Container } from './Container';
import { createToken, optional } from './createToken/createToken';

describe('DI Container', () => {
  it('Использование useValue провайдеров', () => {
    const container = new Container();
    const stringToken = createToken('stringToken');
    const stringPayload = '__value__';

    container.register({ provide: stringToken, useValue: stringPayload });

    expect(container.get(stringToken)).toBe(stringPayload);

    /* Тестирование class */
    const classToken = createToken<SecretClass>('classToken');
    class SecretClass {
      testMethod() {
        return 'ra';
      }
    }

    container.register({ provide: classToken, useValue: new SecretClass() });

    expect(container.get(classToken).testMethod()).toBe('ra');
  });

  it('Использование useClass провайдеров', () => {
    const container = new Container();
    const result = 'Oby';
    class TestClass {
      method() {
        return result;
      }
    }
    const token = createToken<TestClass>('tokenName');

    container.register({ provide: token, useClass: TestClass });

    expect(container.get(token).method()).toBe(result);
  });

  it('Использование useFactory провайдеров', () => {
    const container = new Container();
    const result = 'Oby';
    const factory = () => result;
    const token = createToken<string>('tokenName');

    container.register({ provide: token, useFactory: factory });

    expect(container.get(token)).toBe(result);
  });

  it('Использование токенов, созданных без названия', () => {
    const container = new Container();
    const result = 'foo bar';
    const factory = (deps: any) => `foo ${deps.bar}`;
    const foo = createToken<string>();
    const bar = createToken<string>();

    container.register({ provide: bar, useValue: 'bar' });
    container.register({ provide: foo, useFactory: factory, deps: { bar } });

    expect(container.get(foo)).toBe(result);
  });

  it('Динамическая инициализация при получении класса', () => {
    const container = new Container();
    let modA = 'PO';
    let modB = 'LK';
    let modC = 'GF';

    class A {
      constructor() {
        modA = 'A';
      }
    }
    class B {
      constructor() {
        modB = 'B';
      }
    }
    function ccc() {
      modC = 'C';
    }

    const tokenA = createToken<A>('tokenA');
    const tokenB = createToken<B>('tokenB');
    const tokenC = createToken('tokenC');

    container.register({ provide: tokenA, useClass: A });
    container.register({ provide: tokenB, useClass: B });
    container.register({ provide: tokenC, useFactory: ccc });

    container.get(tokenA);

    expect(modA).toBe('A');
    expect(modB).toBe('LK');
    expect(modC).toBe('GF');

    container.get(tokenB);

    expect(modA).toBe('A');
    expect(modB).toBe('B');
    expect(modC).toBe('GF');

    container.get(tokenC);

    expect(modA).toBe('A');
    expect(modB).toBe('B');
    expect(modC).toBe('C');
  });

  it('Зависимости', () => {
    const result: string[] = [];
    const container = new Container();

    class A {
      get() {
        return 'Token A';
      }
    }
    function bbb({ tokenC }: any) {
      return { a: { b: `token B ${tokenC.a.b}` } };
    }
    const c = {
      a: { b: 'token C' },
    };
    class D {
      constructor({ tokenA, tokenB, tokenC }: any) {
        result.push(tokenA.get());
        result.push(tokenC.a.b);
        result.push(tokenB.a.b);
      }
    }

    container.register({ provide: 'tokenA', useClass: A });
    container.register({
      provide: 'tokenB',
      useFactory: bbb,
      deps: { tokenC: 'tokenC' },
    });
    container.register({ provide: 'tokenC', useValue: c });
    const depsTokenD = { tokenA: 'tokenA', tokenB: 'tokenB', tokenC: 'tokenC' };
    container.register({
      provide: 'tokenD',
      useClass: D,
      deps: depsTokenD,
    });

    container.get('tokenD');

    expect(result).toEqual(['Token A', 'token C', 'token B token C']);

    // Проверяем работу getOfDeps
    expect(Object.keys(container.getOfDeps(depsTokenD))).toEqual(['tokenA', 'tokenB', 'tokenC']);
    expect(container.getOfDeps(depsTokenD).tokenC).toEqual({ a: { b: 'token C' } });
  });

  it('Опциональные зависимости - получение null если нет', () => {
    const container = new Container();
    const result: any[] = [];

    const K = createToken<number>('K');

    container.register({
      provide: 'A',
      useValue: 9,
    });

    container.register({
      provide: 'B',
      useFactory: ({ a, b }) => {
        result.push(a, b);
      },
      deps: { a: 'A', b: { token: K, optional: true } },
    });

    container.get('B');

    expect(result).toEqual([9, null]);
  });

  it('Опциональные зависимости - получение пустого массива если нет, multi token', () => {
    const container = new Container();
    const result: any[] = [];

    const K = createToken<number>('K', { multi: true });

    container.register({
      provide: 'A',
      useValue: 9,
    });

    container.register({
      provide: 'B',
      useFactory: ({ a, b }) => {
        result.push(a, b);
      },
      deps: { a: 'A', b: { token: K, optional: true } },
    });

    container.get('B');

    expect(result).toEqual([9, []]);
  });

  it('Опциональные зависимости - получение null если нет, хэлпер optional', () => {
    const container = new Container();
    const result: any[] = [];

    container.register({
      provide: 'A',
      useValue: 9,
    });

    container.register({
      provide: 'B',
      useFactory: ({ a, b }) => {
        result.push(a, b);
      },
      deps: { a: 'A', b: optional('K' as any) },
    });

    container.get('B');

    expect(result).toEqual([9, null]);
  });

  it('Опциональные зависимости - получение null если нет, строковый токен', () => {
    const container = new Container();
    const result: any[] = [];

    container.register({
      provide: 'A',
      useValue: 9,
    });

    container.register({
      provide: 'B',
      useFactory: ({ a, b }) => {
        result.push(a, b);
      },
      deps: { a: 'A', b: { token: 'K', optional: true } },
    });

    container.get('B');

    expect(result).toEqual([9, null]);
  });

  it('Опциональные зависимости - получение значения если есть', () => {
    const container = new Container();
    const result: any[] = [];

    container.register({
      provide: 'A',
      useValue: 9,
    });

    container.register({
      provide: 'K',
      useValue: 5,
    });

    container.register({
      provide: 'B',
      useFactory: ({ a, b }) => {
        result.push(a, b);
      },
      deps: { a: 'A', b: { token: 'K', optional: true } },
    });

    container.get('B');

    expect(result).toEqual([9, 5]);
  });

  it('Опциональные зависимости - получение null если не удалось создать запрошенную сущность', () => {
    const container = new Container();
    const result: any[] = [];

    container.register({
      provide: 'A',
      useFactory: () => {
        return 9;
      },
      deps: {
        c: 'C',
      },
    });

    container.register({
      provide: 'B',
      useFactory: ({ a }) => {
        result.push(a);
      },
      deps: { a: { token: 'A', optional: true } },
    });

    expect(() => container.get('B')).not.toThrow();
    expect(result).toEqual([null]);
  });

  it('Мульти провайдер', () => {
    const container = new Container();
    container.register({ provide: 'B', useValue: 2, multi: true });
    container.register({ provide: 'A', useValue: { a: 1 }, multi: true });
    container.register({
      provide: 'A',
      useFactory: ({ B }) => ({ b: B[0] }),
      deps: { B: 'B' },
      multi: true,
    });

    expect(container.get('A')).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('Мульти провайдер, берем multi из токена', () => {
    const container = new Container();

    const A = createToken('A', { multi: true });
    const B = createToken('B', { multi: true });

    container.register({ provide: B, useValue: 2 });
    container.register({ provide: A, useValue: { a: 1 } });
    container.register({
      provide: A,
      useFactory: ({ B }) => ({ b: B[0] }),
      deps: { B },
    });

    expect(container.get(A)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  it('Мульти провайдер, берем multi из провайдера (backward compatibility)', () => {
    const container = new Container();

    const A = createToken('A');
    const B = createToken('B');

    container.register({ provide: B, useValue: 2, multi: true });
    container.register({ provide: A, useValue: { a: 1 }, multi: true });
    container.register({
      provide: A,
      useFactory: ({ B }) => ({ b: B[0] }),
      deps: { B },
      multi: true,
    });

    expect(container.get(A)).toEqual([{ a: 1 }, { b: 2 }]);
  });

  describe('Ошибки', () => {
    it('смешивание multi true/false', () => {
      const container = new Container();

      try {
        container.register({ provide: 'A', useValue: { a: 1 }, multi: false });
        container.register({ provide: 'A', useValue: { a: 1 }, multi: true });
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('Mixed multi-provider for A');
        expect(e.type).toBe('MixedMulti');
      }

      try {
        // @ts-ignore
        container.register({ provide: 'B', __stack: new Error().stack, useValue: 1, multi: false });
        // @ts-ignore
        container.register({ provide: 'B', __stack: new Error().stack, useValue: 2, multi: true });
      } catch (e) {
        expect(e.stack).toMatch(/---- caused by: ----[\s\S]+Container.spec.ts/);
      }
    });

    it('не найден провайдер', () => {
      const container = new Container();
      const token = createToken('tadam');
      container.register({
        provide: token,
        // @ts-ignore
        __stack: new Error().stack,
        useClass: class Sdsa {},
        deps: { jj: 'jj' },
      });

      try {
        container.get(token);
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('Token not found "jj" at "tadam"');
        expect(e.type).toBe('NotFound');
        expect(e.stack).toMatch(/---- caused by: ----[\s\S]+Container.spec.ts/);
      }
    });

    it('circular зависимости', () => {
      const container = new Container();
      container.register({
        provide: 'A',
        useFactory: (a) => {
          throw new Error('never');
        },
        deps: { B: 'B' },
      });
      container.register({
        provide: 'B',
        useFactory: (a) => {
          throw new Error('never');
        },
        deps: { A: 'A' },
      });

      try {
        container.get('B');
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('Circular dep for "B" at "A" < B');
        expect(e.type).toBe('CircularDep');
      }
    });

    it('не верный формат provider', () => {
      const container = new Container();
      expect(() => container.register(undefined as any)).toThrowErrorMatchingInlineSnapshot(
        `"Invalid provider. Check what is passed to the DI. Current value is not a provider: "undefined""`
      );

      expect(() =>
        container.register({ provide: undefined, useValue: 1 as any })
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid provider. Check what is passed to the DI. Current value is not a provider: {"provide":"undefined","useValue":1}"`
      );

      expect(() =>
        // @ts-ignore
        container.register({ provide: 'testio' })
      ).toThrowErrorMatchingInlineSnapshot(
        `"Invalid provider. Check what is passed to the DI. Current value is not a provider: {"provide":"testio"}"`
      );

      try {
        // @ts-ignore
        container.register({ provide: undefined, __stack: new Error().stack, useValue: 1 });
      } catch (e) {
        expect(e.stack).toMatch(/---- caused by: ----[\s\S]+Container.spec.ts/);
      }
    });

    it('вложенная неопциональная зависимость не должна ломать получение зависимости после', () => {
      const container = new Container();

      container.register({
        provide: 'A',
        useFactory: () => {
          return 'success';
        },
        deps: {
          b: { token: 'B', optional: true },
          c: { token: 'C', optional: true },
        },
      });
      container.register({
        provide: 'B',
        useFactory: () => {},
        deps: {
          c: 'C',
        },
      });
      container.register({
        provide: 'C',
        useFactory: () => {},
        deps: {
          // такой зависимости нет, поэтому получения токена C будет падать с ошибкой
          d: 'D',
        },
      });

      expect(container.get('A')).toBe('success');
    });

    it('circular multi dependencies', () => {
      const container = new Container();
      container.register({
        provide: 'A',
        useFactory: (a) => {},
        deps: { B: 'B' },
      });
      container.register({
        provide: 'B',
        multi: true,
        useFactory: () => {},
      });
      container.register({
        provide: 'B',
        multi: true,
        useFactory: (a) => {},
        deps: { C: 'C' },
      });
      container.register({
        provide: 'C',
        useFactory: (a) => {},
        deps: { A: 'A' },
      });

      try {
        container.get('B');
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('Circular dep for "B" at "A" < C < B');
        expect(e.type).toBe('CircularDep');
      }
    });

    it('error in dependency factory', () => {
      const container = new Container();
      container.register({
        provide: 'A',
        useFactory: (b) => {},
        deps: { B: 'B' },
      });
      container.register({
        provide: 'B',
        useFactory: () => {
          throw new Error('broken');
        },
      });

      try {
        container.get('B');
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('broken at "B"');
      }

      // second call returns same error
      try {
        container.get('B');
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('broken at "B"');
      }
    });

    it('error in multi dependency factory, and second call', () => {
      const container = new Container();
      container.register({
        provide: 'A',
        useFactory: (a) => {},
        deps: { B: 'B' },
      });
      container.register({
        provide: 'B',
        multi: true,
        useFactory: () => {},
      });
      container.register({
        provide: 'B',
        multi: true,
        useFactory: () => {
          throw new Error('broken');
        },
      });

      try {
        container.get('B');
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('broken at "B"');
      }

      // second call returns same error
      try {
        container.get('B');
        expect(true).toBe(false);
      } catch (e) {
        expect(e.message).toBe('broken at "B"');
      }
    });
  });

  describe('get optional', () => {
    it('Получение отсутсвующих данных', () => {
      const container = new Container();

      expect(container.get({ token: 'Token', optional: true })).toBe(null);
    });

    it('Получение данных с multi провайдером TCORE-2540', () => {
      const container = new Container();
      container.register({
        provide: 'Token multi',
        multi: true,
        useFactory: () => {},
        deps: { aa: 'aa' },
      });

      expect(() =>
        // @ts-ignore
        container.get({ token: 'Token multi', optional: true })
      ).toThrowErrorMatchingInlineSnapshot(`"Token not found "aa" at "Token multi""`);
    });

    it('optional with deep multi error deps', () => {
      const container = new Container();
      container.register({
        provide: 'Multi first',
        multi: true,
        useFactory: ({ dep1 }) => {
          return dep1;
        },
        deps: { dep1: 'Multi second' },
      });
      container.register({
        provide: 'Multi second',
        multi: true,
        useFactory: () => {
          return 'Multi second value 1';
        },
        deps: { dep1: 'Multi error' },
      });
      container.register({
        provide: 'Multi error',
        multi: true,
        useFactory: () => {},
        deps: { dep1: { token: 'token not found', optional: false } },
      });

      expect(() =>
        container.get({ token: 'Multi first', optional: true })
      ).toThrowErrorMatchingInlineSnapshot(
        `"Token not found "token not found" at "Multi error" < Multi second < Multi first"`
      );
    });

    it('optional with nothing', () => {
      const container = new Container();
      expect(container.get({ token: 'not', optional: true })).toBe(null);
    });
  });

  describe('correct error message on hydration should be returned when', () => {
    it('one level of modules', () => {
      const container = new Container([
        {
          provide: 'test_module_token',
          useFactory: () => {
            throw new Error('Test error');
          },
        },
      ]);

      expect(() => {
        container.get('test_module_token');
      }).toThrow('Test error at "test_module_token"');
    });

    it('two levels of modules', () => {
      const container = new Container([
        {
          provide: 'dependant',
          deps: {
            dep: 'dependency',
          },
          useFactory: () => {},
        },
        {
          provide: 'dependency',
          useFactory: () => {
            throw new Error('Some error');
          },
        },
      ]);

      expect(() => {
        container.get('dependant');
      }).toThrow('Some error at "dependency" < dependant');
    });
  });

  describe('fallback', () => {
    it('base case', () => {
      const mockFactory = jest.fn(() => 'mock');
      const fallback = new Container();

      fallback.register({
        provide: 'test',
        useFactory: mockFactory,
      });

      const container = new Container([], fallback);

      expect(container.get('test')).toBe('mock');
    });
  });

  describe('borrowing tokens', () => {
    it('prevent borrow if dependency exists', () => {
      const from = new Container([
        {
          provide: 'dep',
          useValue: 'from',
        },
      ]);

      const container = new Container([
        {
          provide: 'dep',
          useValue: 'container',
        },
      ]);

      container.borrowToken(from, 'dep');

      expect(container.get('dep')).toBe('container');
    });

    it('prevent borrow if fallback exists', () => {
      const from = new Container([
        {
          provide: 'dep',
          useValue: () => ({}),
        },
      ]);

      const container = new Container([], from);

      container.borrowToken(from, 'dep');

      // "dep" exists and value is the same as from fallback
      expect(container.get('dep')).toBe(from.get('dep'));
    });

    it('borrow dependency without transitive deps', () => {
      const from = new Container([
        {
          provide: 'dep',
          useFactory: () => ({}),
        },
      ]);

      const container = new Container([]);

      container.borrowToken(from, 'dep');

      // "dep" exists and value is unique
      expect(container.get('dep')).not.toBe(from.get('dep'));
    });

    it('borrow dependency with transitive deps, transitive dependency from current di', () => {
      const from = new Container([
        {
          provide: 'dep',
          useValue: 'from',
        },
        {
          provide: 'test',
          useFactory: ({ dep }) => {
            return `test-${dep}`;
          },
          deps: {
            dep: 'dep',
          },
        },
      ]);
      const container = new Container([
        {
          provide: 'dep',
          useValue: 'container',
        },
      ]);

      container.borrowToken(from, 'test');

      expect(container.get('test')).toBe('test-container');
    });

    it('borrow dependency with transitive deps, transitive dependency from current di overwrite dependency from fallback', () => {
      const from = new Container([
        {
          provide: 'dep',
          useValue: 'from',
        },
        {
          provide: 'test',
          useFactory: ({ dep }) => {
            return `test-${dep}`;
          },
          deps: {
            dep: 'dep',
          },
        },
      ]);
      const container = new Container(
        [
          {
            provide: 'dep',
            useValue: 'container',
          },
        ],
        from
      );

      expect(container.get('test')).toBe('test-from');

      container.borrowToken(from, 'test');

      expect(container.get('test')).toBe('test-container');
    });

    it('borrow dependency with transitive deps, transitive dependency also borrowed (for string token)', () => {
      const from = new Container([
        {
          provide: 'dep',
          useFactory: () => ({}),
        },
        {
          provide: 'test',
          useFactory: ({ dep }) => {
            return 'test';
          },
          deps: {
            dep: 'dep',
          },
        },
      ]);
      const container = new Container([]);

      container.borrowToken(from, 'test');

      // "dep" exists and value is unique
      expect(container.get('dep')).not.toBe(from.get('dep'));
    });

    it('borrow dependency with transitive deps, transitive dependency also borrowed (for createToken)', () => {
      const dep = createToken();

      const from = new Container([
        {
          provide: dep,
          useFactory: () => ({}),
        },
        {
          provide: 'test',
          useFactory: ({ dep }) => {
            return 'test';
          },
          deps: {
            dep,
          },
        },
      ]);
      const container = new Container([]);

      container.borrowToken(from, 'test');

      // "dep" exists and value is unique
      expect(container.get(dep)).not.toBe(from.get(dep));
    });

    it('borrow dependency with transitive deps, transitive dependency also borrowed (for multi provider)', () => {
      const from = new Container([
        {
          provide: 'dep',
          multi: true,
          useFactory: () => ({}),
        },
        {
          provide: 'dep',
          multi: true,
          useFactory: () => ({}),
        },
        {
          provide: 'dep',
          multi: true,
          useFactory: (foo) => ({}),
          deps: {
            foo: 'foo',
          },
        },
        {
          provide: 'foo',
          useFactory: () => ({}),
        },
        {
          provide: 'test',
          useFactory: ({ dep }) => {
            return 'test';
          },
          deps: {
            dep: 'dep',
          },
        },
      ]);
      const container = new Container([]);

      container.borrowToken(from, 'test');

      // "dep" exists
      expect(container.get('dep').length).toBe(3);
      // and value is unique
      expect(container.get('dep')[0]).not.toBe(from.get('dep')[0]);
      // and defined
      expect(container.get('dep')[0]).not.toBe(undefined);
      // "foo" exists and value is unique
      expect(container.get('foo')).not.toBe(from.get('foo'));
    });
  });
});
/* eslint-enable jest/no-conditional-expect */
