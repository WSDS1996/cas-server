import type { Response } from 'express';
import { resCode } from '../enums';
import * as _ from 'lodash';

/**
 * 随机字符
 * @param {number} number default 16
 * @param {string} prefix
 * @param {string} suffix
 */
export const getUniCode = (length: number = 16, prefix: string = '', suffix: string = ''): string => {
  if (length < 6) length = 6;

  const upperOrLower = [String.prototype.toLowerCase, String.prototype.toUpperCase];

  return (
    prefix +
    Array.from({ length }, () => {
      const m = Math.random();
      return upperOrLower[Math.floor(m * upperOrLower.length)].call(m.toString(36).slice(-1));
    }).join('') +
    suffix
  );
};

type validationRulesType = {
  [key: string]: {
    type: 'string' | 'boolean' | 'timestamp' | 'number' | 'date';
    default?: any;
    required?: boolean;
    from?: any;
    validation?: (value: any) => boolean;
  };
};
type validationDataType = {
  [key: string]: any;
};
type validationType = {
  result?: string[];
} & validationDataType;

export const validate = (rules: validationRulesType, data: validationDataType): validationType => {
  let result: string[] = [];
  const summary = {};
  if (rules instanceof Object) {
    if (!data) {
      result.push(`无参数`);
      return { result, ...data };
    }

    for (const item in rules) {
      const value = rules[item];

      // from
      if (value.hasOwnProperty('from') && typeof value.from === 'object') {
        data[item] = data[item] || value.from[item];
      }

      // default
      if (value.hasOwnProperty('default') && _.isEmpty(data[item])) {
        data[item] = value.default;
      }

      // required
      if (_.isEmpty(data[item])) {
        if (!value.required) continue;
        result.push(`缺少参数${item}`);
        continue;
      }

      // type
      let skipType = false;
      try {
        switch (value['type']) {
          case 'number':
            data[item] = parseInt(data[item]);
            break;
          case 'boolean':
            data[item] = JSON.parse(data[item]);
            break;
          case 'timestamp':
            data[item] = new Date(parseInt(data[item]));
            skipType = !isNaN(Date.prototype.getTime.call(data[item]));
            break;
          case 'date':
            data[item] = new Date(data[item]);
            skipType = !isNaN(Date.prototype.getTime.call(data[item]));
            break;
          default:
        }
      } catch (error) {
        result.push(`参数${item}格式解析${value['type']}错误`);
      }
      if (!skipType && typeof data[item] !== value['type']) {
        result.push(`参数${item}必须是${value['type']}`);
      }

      //validation
      if (value['validation']) {
        const validation = value['validation'];
        if (!validation(data[item])) {
          result.push(`参数${item}格式不正确`);
        }
      }

      if (!_.isEmpty(data[item])) summary[item] = data[item];
    }

    return { result, ...data, summary };
  }

  return { result: ['参数校验规则错误'], ...data, summary };
};

type ResponseData = {
  code?: number;
  message?: string;
  data?: any;
  count?: number;
  callbackUrl?: string;
};
// request success
export const success = (res: Response, data: ResponseData = {}) => {
  res.status(200).json({
    code: resCode.SUCCESS,
    message: '请求成功！',
    ...data,
  });
};

// request fail
export const fail = (res: Response, data: ResponseData = {}) => {
  res.status(200).json({
    code: resCode.FAIL,
    message: '请求失败！',
    ...data,
  });
};
