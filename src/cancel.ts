

export class Cancel {
    public message: string;
    constructor(message: string) {
        this.message = message;
    }
}

export const isCancel = (error: any) => {
    return error instanceof Cancel;
}

export class CancelToken {
    public resolve: any;
    source() {
        return {
            token: new Promise((resolve) => {
                this.resolve = resolve
            }),
            cancel: (message: string) => {
                this.resolve(new Cancel(message))
            }
        }
    }

}