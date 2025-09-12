import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { Callbacks, SocketAction, SocketCallback, SocketMessage } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket?: Socket;
  private callbacks: Callbacks = {} as Callbacks;

  constructor() {
  }

  init(userId: string, roomIds: string[]){
    if(this.socket){
      this.socket.disconnect()
    }
    this.socket = io(environment.backendUrl, {
      auth: {
        userId,
        roomIds,
      },
      transports: ['websocket'],
      secure: true
    });
    this.socket.on('messageToClient', (data: SocketMessage<SocketAction>) => {
      if(this.callbacks[data.action]){
        // @ts-ignore
        this.callbacks[data.action](data);
      }
    });
  }

  onMessage<A extends SocketAction>(action: A, callback: SocketCallback<A>) {
    // @ts-ignore
    this.callbacks[action] = (data:SocketMessage<A>) => {
      return callback(data)
    };
  }

  unsubscribe(action: SocketAction){
    delete this.callbacks[action];
  }

  disconnect() {
    if(this.socket){
      this.socket.disconnect();
    }
  }


}

