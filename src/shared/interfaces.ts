export namespace ApiData {
    export namespace Response {
        export interface Channel {
            id: number;
            name: string;
        }

        export interface Message {
            id: number;
            channelId: number;
            createdAt: string;
            body: string;
        }

        export interface Data {
            channels: Channel[];
            messages: Message[];
        }
    }

    export namespace Payload {
        export namespace Create {
            export interface Message {
                channelId: number;
                body: string;
            }
        }
    }
}