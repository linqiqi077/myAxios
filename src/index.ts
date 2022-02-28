
import { AxiosRequestConfig, AxiosResponse } from './index.d';
import InterceptorManager, { Interceptor } from './interceptorManager';

const qs = (params: Record<string, any> | null) => {
    let res = '';
    if (typeof params === 'object' && params !== null) {
        for (const key in params) {
            res += `${key}=${params[key]}&`
        }
    }
    return res.substring(0, res.length - 1)
}

const defaults: AxiosRequestConfig = {
    method: 'get',
    headers: {
        common: {
            accept: 'application/json',
        }
    }
}

const getStyleMethods = ['get', 'options', 'head'];
const postStyleMethods = ['put', 'post', 'patch'];

getStyleMethods.forEach((method: string) => {
    defaults.headers![method] = {}
})

postStyleMethods.forEach((method: string) => {
    defaults.headers![method] = {
        'content-type': 'application/json'
    }
})

const allMethods = [...getStyleMethods, ...postStyleMethods]

class Axios<T> {
    public defaults: AxiosRequestConfig = defaults
    public interceptors = {
        request: new InterceptorManager<AxiosRequestConfig>(),
        response: new InterceptorManager<AxiosResponse<T>>(),
    }
    request(config: AxiosRequestConfig): PromiseLike<AxiosRequestConfig> | PromiseLike<AxiosResponse<T>> {
        config.headers = Object.assign({}, this.defaults.headers, config.headers)

        if (config.transformRequest && config.data) {
            config.data = config.transformRequest(config.data, config.headers)
        }
        const chain: Array<Interceptor<AxiosRequestConfig> | Interceptor<AxiosResponse<T>>> = [
            { onFulfilled: this.dispatchRequest }
        ]
        this.interceptors.request.interceptors.forEach((interceptor: Interceptor<AxiosRequestConfig> | null) => {
            interceptor && chain.unshift(interceptor)
        })

        this.interceptors.response.interceptors.forEach((interceptor: Interceptor<AxiosResponse<T>> | null) => {
            interceptor && chain.push(interceptor)
        })

        // let promise: AxiosResponse<T> | AxiosRequestConfig | PromiseLike<AxiosRequestConfig | AxiosResponse<T>> = Promise.resolve(config)
        let promise: any = Promise.resolve(config)
        while (chain.length) {
            const { onFulfilled, onRejected } = chain.shift()!
            if (onFulfilled) {

                promise = promise.then(onFulfilled, onRejected)
            }
        }
        return promise;
    }

    dispatchRequest<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {

        return new Promise<AxiosResponse<T>>((resolve, reject) => {
            let { url = '', method = '', params, data = null, headers, timeout } = config;

            const request = new XMLHttpRequest()

            if (params) {
                url! += (url!.indexOf('?') !== -1 ? '&' : '?') + typeof params === 'string' ? params : qs(params)
            }
            if (data) {
                data = JSON.stringify(data)
            }

            request.open(method, url)

            if (headers) {
                for (const key in headers) {
                    if (key === 'common' || allMethods.includes(key)) {

                        if (key === 'common' || config.method === key) {
                            for (const key2 in headers[key]) {
                                request.setRequestHeader(key2, headers[key][key2])
                            }
                        }
                    } else {
                        request.setRequestHeader(key, headers[key])
                    }
                }
            }

            if (timeout) {
                request.timeout = timeout;
                request.ontimeout = (e) => {
                    reject('Error: Request timeout ' + timeout)
                }
            }

            if (config.cancelToken) {
                config.cancelToken.then((message: string) => {
                    request.abort();
                    reject(message)
                })
            }

            request.onreadystatechange = (e) => {
                // 如果超时 状态码为 0
                if (request.readyState === 4 && request.status !== 0) {
                    if (request.status >= 200 && request.status < 300) {
                        let response: AxiosResponse<T> = {
                            data: request.response,
                            responesText: request.responseText,
                            status: request.status,
                            statusText: request.statusText,
                            request
                        }

                        if (config.transformResponse) {
                            response = config.transformResponse(request.response)
                        }
                        resolve(response)
                    } else {
                        reject('Error: Request failed with status code ' + request.status)
                    }
                }
            }

            request.onerror = (e) => {
                reject('请求出错')
            }

            request.send(data)

        })

    }
}

const context = new Axios();
const instance = context.request.bind(context)

export default instance