import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { STATIC_PAGES, StaticPageContent } from '../../../content/static-page.content';
import { PublicNavComponent } from '../../shared/public-nav/public-nav.component';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule, RouterModule, PublicNavComponent, PublicFooterComponent],
  templateUrl: './static-page.component.html',
  styleUrls: ['./static-page.component.css']
})
export class StaticPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  pageKey = '';
  content?: StaticPageContent;

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.pageKey = data['pageKey'] || '';
      this.content = STATIC_PAGES[this.pageKey];
    });
  }
}
