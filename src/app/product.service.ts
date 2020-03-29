import { Injectable } from '@angular/core';
import * as firebase from 'firebase';
import { Events } from '@ionic/angular';

import { Observable, Subject } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class ProductService {
  // Access the firebase 
  database = firebase.firestore();
  ref = firebase.database().ref('menus/');
  private eventSubject = new Subject<any>();
  usertype:string = "";

  public products:Array<any>= [];
  
  constructor(private router:Router) {
    this.database.collection("products");
    var storage = firebase.storage();
    var self=this;
 
    this.database.collection("products")
       .onSnapshot(function(querySnapshot) {
          console.log("items list retrieved from firebase");
          self.products = [];
          querySnapshot.forEach(function(doc) {
          var product = doc.data();
          self.products.push({name:product.name , price:product.price, category:product.category, image:product.image, uid:product.uid, id:product.id})
        });

        self.publishEvent({
          foo: 'bar'
        });
    console.log("Products Reloaded");
    } );
    
  }
  
  createProduct(name:string, price:number, category:string,
                image:string, description:string){
    /*this.products.push({
      'name': name,
      'price': price,
      'category': category,
      'image' : image,
      'description' : description,
      'uid' : uid
    });*/
    // Only the owner shoulf be able to create products.
    if (this.usertype == "owner") {
      let uid=firebase.auth().currentUser.uid;
      console.log(uid, " :****** uid");
      var db = firebase.firestore();
      db.collection("products").add({
        'name': name,
        'price': price,
        'category': category,
        'image': image,
        'description': description,
        'uid': uid
    })
    .then(function(docRef) {
      console.log("Document written with ID: ", docRef.id);

      //update this products arrays
    })
    .catch(function(error) {
      console.error("Error adding document: ", error);
    });
    } else{
      console.log("User does not have owner privileges.");
    }
  }

  deleteProduct(id){
    var self=this;
    self.database.collection("products").doc(id).delete().then(function() {
      console.log("Document successfully deleted!");
      self.router.navigate(["/tabs/product-list"]);
    }).catch(function(error) {
      console.error("Error removing document: ", error);
    }); 
  }

  getProducts():any {
    var itemsObservable = new Observable(observer => {
      setTimeout(() => {
          observer.next(this.products);
      }, 1000);
    });
    
    return itemsObservable;
  }

  getObservable(): Subject<any> {
    return this.eventSubject;
  }

  publishEvent(data: any) {
    this.eventSubject.next(data);
  }

  setUsertype(type:string){

    var self=this;
    this.usertype = type;
    console.log("Usertype set as: " + type);
    if (this.usertype == "visitor"){
       this.database.collection("products")
         .onSnapshot(function(querySnapshot) {
            console.log("product list changed...........");
            self.products = [];
            querySnapshot.forEach(function(doc) {
                var product = doc.data();
                self.products.push({name:product.name , price:product.price, category:product.category, image:product.image, uid:product.uid})
            });
            // self.events.publish('dataloaded',Date.now());
            self.publishEvent({
                  foo: 'bar'
              });
            console.log("items reloaded");
        } );
    }
    else{
     this.database.collection("products").where("uid", "==", firebase.auth().currentUser.uid)
      .onSnapshot(function(querySnapshot) {
        console.log("product list changed...........");
        self.products = [];
        querySnapshot.forEach(function(doc) {
          var product = doc.data();
          self.products.push({name:product.name , price:product.price, category:product.category, image:product.image, uid:product.uid});
        });
        // self.events.publish('dataloaded',Date.now());
        self.publishEvent({
            foo: 'bar'
        });
    });
  }
  }
}

export const snapshotToArray = snapshot => {
  let returnArr = [];

  snapshot.forEach(childSnapshot => {
      let item = childSnapshot.val();
      item.id = childSnapshot.key;
      // console.log(item);
      returnArr.push(item);
  });

  return returnArr;
}