import { Request, Response, NextFunction, RequestHandler } from 'express';
import createError from 'http-errors';
import { dataSource, redis } from '../database';
import { resCode } from '../enums';
import { LoginLog, User, Application } from '../models';
import { encryption, valid, validate, success, fail, getUniCode } from '../util';
import * as _ from 'lodash';

/**
 * index
 * @returns '/application'
 */
export const index = (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  res.send('/application');
  return;
};

/**
 * 新增项目
 * @param req.body.name string 名称
 * @param req.body.domain string  域名
 * @param req.body.desc string  描述
 * @param req.body.whitelistIp string ip白名单
 * @method POST
 */
export const register = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, domain, desc, result, expire, whitelistIp } = validate(
    {
      name: { type: 'string', required: true },
      domain: { type: 'string', required: true, validation: valid.isUrl },
      whitelistIp: { type: 'string' },
      desc: { type: 'string' },
      expire: { type: 'timestamp' },
    },
    req.body,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: result.join(';') });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOne({ where: [{ domain }] });

  // user repeated
  if (appInfo) {
    fail(res, { code: resCode.EXISTED, message: `${domain} existed !` });
    return;
  }
  // 设置管理员
  const administrator = res.locals.profile.unId;

  const token = getUniCode(12);

  // 默认项目是启动的和开启调试的
  repository.insert({
    name,
    domain,
    desc,
    token,
    expire,
    administrator,
    isEnable: true,
    whitelistIp,
    isDebug: true,
  });

  success(res, { message: `${name}:${domain} registered successful !`, data: { token } });
  return;
};

/**
 * 编辑项目
 * @param req.body.token string 项目token
 * @param req.body.domain string  项目域名
 * @param req.body.name string    项目名称
 * @param req.body.desc string    项目
 * @param req.body.expire string
 * @param req.body.whitelistIp string ip白名单
 * @param req.body.isEnable boolean 是否开启
 * @param req.body.members string 成员名单，用,分隔
 * @method PUT
 */
export const update = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { name, token, domain, desc, expire, whitelistIp, isEnable, members, result } = validate(
    {
      token: { type: 'string', required: true },
      name: { type: 'string' },
      domain: { type: 'string', validation: valid.isUrl },
      desc: { type: 'string' },
      expire: { type: 'timestamp' },
      whitelistIp: { type: 'string' },
      isEnable: { type: 'boolean' },
      members: { type: 'string' },
    },
    req.body,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: result.join(';') });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ token });

  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `token: ${token} not existed!` });
    return;
  }

  await repository.update(
    { token },
    {
      name,
      desc,
      domain,
      expire,
      whitelistIp,
      isEnable,
      members,
    },
  );

  delete appInfo.common;

  success(res, { message: `app: ${token} updated!!!` });
  return;
};

/**
 * 删除项目
 * @param req.body.id string
 * @method DELETE
 */
export const remove = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { token, result } = validate(
    {
      token: { type: 'string', required: true },
    },
    req.query,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: result.join(';') });
    return;
  }

  const repository = dataSource.getRepository(Application);
  const appInfo = await repository.findOneBy({ token });

  // user repeated
  if (!appInfo) {
    fail(res, { code: resCode.NOT_EXIST, message: `token: ${token} not registered!` });
    return;
  }
  // 只有管理员和系统管理员可以删除
  if (res.locals.profile.unId !== appInfo.administrator && !res.locals.profile.manager) {
    fail(res, { code: resCode.IN_PRIVILEGE, message: `非项目管理员，无权限删除!` });
    return;
  }

  repository.remove(appInfo);

  success(res, { message: `${appInfo.name} has been removed!` });
  return;
};

/**
 * 项目列表
 * @param req.query.domain string
 * @param req.query.token string
 * @param req.query.name string
 * @param req.query.page string
 * @param req.query.size string
 * @method GET
 */
export const query = async (req: Request, res: Response, next: NextFunction): Promise<RequestHandler> => {
  const { page, size, token, domain, name, result } = validate(
    {
      page: { type: 'number', default: 1 },
      size: { type: 'number', default: 20 },
      token: { type: 'string' },
      name: { type: 'string' },
      domain: { type: 'string' },
    },
    req.query,
  );
  // 参数校验
  if (result.length) {
    fail(res, { code: resCode.MISTAKE, message: result.join(';') });
    return;
  }

  const params = { token, name, domain };
  const where = Object.keys(params).reduce((acc, key) => {
    const value = params[key];
    if (!_.isEmpty(value)) {
      acc.push({ [key]: value, common: { isActive: true } });
    }
    return acc;
  }, []);

  const repository = dataSource.getRepository(Application);
  const appList = await repository.findAndCount({
    take: size,
    skip: (page - 1) * size,
    where,
  });

  if (!appList) {
    fail(res, { code: resCode.NOT_EXIST, message: `数据不存在` });
    return;
  }

  const List = appList[0].reduce((res, item) => {
    if (item.common) delete item.common;
    res.push(item);
    return res;
  }, []);

  success(res, {
    message: '成功',
    data: List,
    count: appList[1],
  });
  return;
};
