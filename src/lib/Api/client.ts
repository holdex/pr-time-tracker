import axios, { type AxiosInstance, type Canceler, type AxiosRequestConfig } from 'axios';
import { isDev } from '$lib/config';
import { makeReqInterceptor } from "./middleware";

class Client {
    instance: AxiosInstance

    constructor() {
        this.instance = axios.create()
        this.instance.interceptors.request.use(makeReqInterceptor(), error => Promise.reject(error));
        this.instance.interceptors.response.use(res => res, error => {
            if (isDev) {
                if (error.response) {
                    console.error('response data error', error.response.data);
                } else if (error.request) {
                    console.error('request error', error.request);
                } else {
                    console.error('settings error', error.message);
                }
            }
            return Promise.reject(error)
        });
    }

    fetch(props: AxiosRequestConfig<any>) {
        return _fetch(this.instance, props)
    }
}

async function _fetch(instance: AxiosInstance, props: AxiosRequestConfig<any>, cancelInstance?: Canceler) {
    const CancelToken = axios.CancelToken;

    return instance({
        url: props.url,
        method: props.method ? props.method : 'POST',
        withCredentials: true,
        headers: {
            'Content-type': 'application/json',
            ...props.headers
        },
        data: props.data,
        cancelToken: new CancelToken(function executor(c) {
            if (cancelInstance) {
                cancelInstance = c;
            }
        })
    }).then(res => {
        if (!res) {
            console.log('network error');
            return { data: null }
        } else {
            return res.data
        }
    }).catch(function (thrown) {
        if (axios.isCancel(thrown)) {
            console.log('Request canceled: ', thrown.message);
        } else {
            if (thrown.response) {
                console.log('Request failed with response', JSON.stringify(thrown.response.data));
                return thrown;
            } else {
                console.log('Request failed', thrown);
                if (thrown.error) {
                    return { data: null, errors: [{ message: thrown.error }] }
                }
                return { data: null, errors: [{ message: "Network error" }] }
            }
        }
    })
}


const client = new Client();
export default client;

