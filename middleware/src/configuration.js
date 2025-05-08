import { defaultAppSettings, getValidator } from '@feathersjs/schema'

import { dataValidator } from './validators.js'

export const configurationSchema = {
  $id: 'configuration',
  type: 'object',
  additionalProperties: false,
  required: ['host', 'port', 'public'],
  properties: {
    ...defaultAppSettings,
    host: { type: 'string' },
    port: { type: 'number' },
    public: { type: 'string' },
    s1: {
      type: 'object',
      required: ['baseUrl', 'username', 'password', 'appId'],
      properties: {
        baseUrl: { type: 'string' },
        username: { type: 'string' },
        password: { type: 'string' },
        appId: { type: 'string' }
      }
    }
  }
}

export const configurationValidator = getValidator(configurationSchema, dataValidator)
