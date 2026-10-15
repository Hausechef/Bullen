import assert from 'node:assert/strict';
import { loginFailure } from '../artifacts/bullenhaus/src/app/login/marketing/loginError.ts';
const cases = [
  [{code:'invalid_credentials',status:400},'Invalid email or password. Please try again.','invalid_credentials · HTTP 400'],
  [{code:'over_request_rate_limit',status:429,message:'Request rate limit reached'},'Too many attempts. Please wait a few minutes and try again.','over_request_rate_limit · HTTP 429'],
  [{code:'email_not_confirmed',status:400},'Account pending activation. Please contact support to verify your account.','email_not_confirmed · HTTP 400'],
  [{code:'user_banned',status:403},'This account is disabled. Please contact support.','user_banned · HTTP 403'],
  [{code:'unexpected_failure',status:500},'The sign-in service returned an error. Please try again later or contact support.','unexpected_failure · HTTP 500'],
  [{code:'validation_failed',status:422},'Please enter the email address registered for this account.','validation_failed · HTTP 422'],
  [{name:'AuthRetryableFetchError'},'Network error. Please check your connection and try again.',''],
  [{name:'NavigatorLockAcquireTimeoutError'},'Another sign-in operation is still pending. Close other Bullenhaus tabs and try again.',''],
  [{message:'secret-example',code:'secret-example',status:200},'Unable to sign in. Please check your credentials or contact support.',''],
  [null,'Unable to sign in. Please check your credentials or contact support.',''],
];
for(const [input,message,diagnostic] of cases) assert.deepEqual(loginFailure(input),{message,diagnostic});
console.log('LOGIN_ERROR_CLASSIFICATION: 10/10 passed; no raw error messages or credentials rendered');
