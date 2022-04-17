import { UserData } from '@yana-exhchange/interface';
import { sign, verify } from 'jsonwebtoken';

const key =
  '40da10d731d9490fb046813deef0d21d40da10d731d9490fb046813deef0d2140da10d731d9490fb046813deef0d2140da10d731d9490fb046813deef0d21';

export function SignData(user: UserData) {
  return sign(user, key);
}
export function VerifyData(token: string) {
  return verify(token, key);
}
