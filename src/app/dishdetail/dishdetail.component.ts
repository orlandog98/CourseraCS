import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from 'src/app/shared/dish';

import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DishService } from 'src/app/services/dish.service';
import { switchMap } from 'rxjs/operators';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Comment } from "src/app/shared/comment";
import{ trigger, state, style, animate, transition} from '@angular/animations';
import { visibility, flyInOut, expand } from '../animations/app.animations';


@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  host: {
    '[@flyInOut]': 'true',
    'style': 'display:block,'
  },
  animations: [
    flyInOut(),
    visibility(),
    expand()
  ]
})
export class DishdetailComponent implements OnInit {


  commentForm: FormGroup;
  errMess: string;
  comment: Comment;
  dish: Dish;
  dishIds: string[];
  prev: string;
  next: string;
  dishcopy: Dish;
  @ViewChild('cform') commentFormDirective;
  visibility = 'shown';

  formErrors = {
    'comment': '',
    'author': ''
  }

  ValidationMessages= {
    'comment': {
      'required': 'Comments are required'
    },
    'author': {
      'required': 'Name is required',
      'minlength': 'Name must be at least 2 characters long'
    },
  };

  constructor(private dishService: DishService,
    private route: ActivatedRoute, 
    private location: Location, private fb: FormBuilder, @Inject('baseURL') private baseURL ) { 
      this.createForm();
    }

  ngOnInit() {
    this.dishService.getDishIds().subscribe((dishIds) => this.dishIds = dishIds);
    this.route.params
    .pipe(switchMap((params:Params) => {this.visibility='hidden'; return this.dishService.getDish(params['id']);}))
    .subscribe(dish=> {this.dish=dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility='shown'; },
    errmess => this.errMess=<any>errmess);

  }

  createForm(): void {
    this.commentForm = this.fb.group({
      author: ['', [Validators.required, Validators.minLength(2)] ],
      rating: 5,
      comment: ['', [Validators.required, Validators.minLength(2)] ],
      date: ''
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }
  

  onSubmit() {
    this.comment=this.commentForm.value;
    this.comment.date= new Date().toISOString();
    console.log(this.comment);   
    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
    .subscribe(dish => {
      this.dish=dish;
      this.dishcopy=dish;
    }, errmess => {this.dish=null; this.dishcopy=null;
    this.errMess=<any> errmess;})
    this.commentFormDirective.resetForm();
    this.commentForm.reset({
      author:'',
      rating: 5,
      comment: ''
    });
    
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) {return;}
    const form = this.commentForm;
    for (const field in this.formErrors) {
      if (this.formErrors.hasOwnProperty(field)) {
        //clear previous error messages 
        this.formErrors[field]='';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.ValidationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.formErrors[field] += messages[key] + '';
            }
          }
        }
      }
    }
  }

  setPrevNext(dishId: string) {
    const index= this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  } 

  goBack(): void {
    this.location.back();
  }

}
