export interface Result<T, E = string> {
  success: boolean;
  data?: T;
  error?: E;
}
