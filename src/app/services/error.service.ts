import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  errorMessage = signal<string>('')

  constructor() { }

  showError(error: Error){
    this.errorMessage.set(error.message)
  }

  hideError(){
    this.errorMessage.set('');
  }
}
