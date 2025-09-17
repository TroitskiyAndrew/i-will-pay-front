import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { ErrorService } from './error.service';
import { IDebt, IMember, IPayment, IRoom, IShare, IUser } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private externalHttpClient: HttpClient;

  constructor(private http: HttpClient, private errorService: ErrorService, private httpBackend: HttpBackend) {
    this.externalHttpClient = new HttpClient(this.httpBackend);
  }

  handleError(error: Error) {
    this.errorService.showError(error);
  }

  auth() {
    const url = `${environment.backendUrl}/auth`;
    return this.http
      .get<{ user: IUser, roomId: string | null, paymentId: string | null }>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }
  createUser(name: string, roomId: string) {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .post<true>(url, { name, roomId })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  updateUser(user: IUser) {
    const url = `${environment.backendUrl}/users`;
    return this.http
      .put<true>(url, { user })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  getUser(userId: string){
    const url = `${environment.backendUrl}/users/${userId}`;
    return this.http
      .get<IUser>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  getRooms() {
    const url = `${environment.backendUrl}/rooms`;
    return this.http
      .get<IRoom[]>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  getRoomState(roomId: string) {
    const url = `${environment.backendUrl}/state/${roomId}`;
    return this.http
      .get(url)
      .toPromise()
      .catch(this.handleError.bind(this)) as Promise<{ debts: IDebt[], hasUnsharedPayment: boolean, unchecked: boolean, }>;
  }

  createRoom(name: string) {
    const url = `${environment.backendUrl}/rooms`;
    return this.http
      .post<IRoom>(url, { name })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  updateRoom(room: IRoom) {
    const url = `${environment.backendUrl}/rooms`;
    return this.http
      .put<true>(url, { room })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  getMembers(roomId: string) {
    const url = `${environment.backendUrl}/members/${roomId}`;
    return this.http
      .get<IMember[]>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  createMember(roomId: string, name: string) {
    const url = `${environment.backendUrl}/members`;
    return this.http
      .post<IMember>(url, { roomId, name })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  updateMember(member: IMember) {
    const url = `${environment.backendUrl}/members`;
    return this.http
      .put<true>(url, { member })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  changeRole(id: string, isAdmin: boolean) {
    const url = `${environment.backendUrl}/role`;
    return this.http
      .put<true>(url, { id, isAdmin })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  getPayments(roomId: string) {
    const url = `${environment.backendUrl}/payments/${roomId}`;
    return this.http
      .get<IPayment[]>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  createPayment(payment: Omit<IPayment, 'id'>, shares: Omit<IShare, 'id'>[]) {
    const url = `${environment.backendUrl}/payments`;
    return this.http
      .post<true>(url, { payment, shares })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  updatePayment(payment: IPayment, shares: IShare[]) {
    const url = `${environment.backendUrl}/payments`;
    return this.http
      .put<true>(url, { payment, shares })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  deletePayment(id: string) {
    const url = `${environment.backendUrl}/payments/${id}`;
    return this.http
      .delete<true>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  getShares(paymentId: string) {
    const url = `${environment.backendUrl}/shares/${paymentId}`;
    return this.http
      .get<IShare[]>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  updateShare(share: IShare) {
    const url = `${environment.backendUrl}/shares`;
    return this.http
      .put<true>(url, { share })
      .toPromise()
      .catch(this.handleError.bind(this));
  }

  deleteShare(id: string) {
    const url = `${environment.backendUrl}/shares/${id}`;
    return this.http
      .delete<true>(url)
      .toPromise()
      .catch(this.handleError.bind(this));
  }
  uploadPhoto(file: File): Promise<string>{
    const formData = new FormData();
    formData.append('image', file);
    return this.externalHttpClient.post(environment.uploadImageUrl, formData).toPromise().then((response: any) => response.data.url).catch((error) => {
      console.log(error);
      return null;
    })
  }
}
