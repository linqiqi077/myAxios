type Methods = 'get' | 'GET' | 'post' | 'POST' | 'delete' | 'DELETE' | 'options' | 'OPTIONS';

import InterceptorManager from "./interceptorManager";
import { CancelToken } from "./cancel";

export interface AxiosRequestConfig {
    url?: string;
    method?: Methods;
    params?: Record<string, any>;
    data?: Record<string, any> | string | null;
    headers?: Record<string, any>;
    timeout?: number;
    transformRequest?: (data: any, headers: any) => any;
    transformResponse?: (response: any) => any;
    cancelToken?: any;
}

export interface AxiosResponse<T = any> {
    data: T,
    responesText: string;
    status: number;
    statusText: string;
    request: XMLHttpRequest
}

export interface AxiosInstance {
    <T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    interceptors: {
        request: InterceptorManager<AxiosRequestConfig>;
        response: InterceptorManager<AxiosResponse>;
    };
    cancelToken: CancelToken;
    isCancel: any;
}