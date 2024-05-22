import { isEmpty, has, PropertyPath } from 'lodash';

type validType = {
  [key: string]: (value: any) => boolean;
};

export const valid: validType = {
  isPhone: (value: string) => {
    return /^1[3456789]\d{9}$/.test(value);
  },
  isEmail: (value: string) => {
    return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(value);
  },
  isUrl: (value: string) => {
    return /(http|https):\/\/([^\r\n]+)/.test(value);
  },
  isIp: (value: string) => {
    const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipArray = value.split(',');
    if (ipArray.length === 0) {
      return false;
    }
    for (const ip of ipArray) {
      // IPv4地址的正则表达式
      if (!ipPattern.test(value)) {
        return false;
      }
      return true;
    }
  },
  isEmpty: (value: any) => isEmpty(value),
};
