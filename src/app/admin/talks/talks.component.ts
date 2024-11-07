import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTableModule, NzTableSortOrder } from 'ng-zorro-antd/table';
import { AdminService } from '../../../services/admin.service';
import { ActivatedRoute } from '@angular/router';
import { NzTableQueryParams } from 'ng-zorro-antd/table';
import { CommonModule } from '@angular/common';
import * as models from '../../../shared/models';

@Component({
  selector: 'app-talks',
  standalone: true,
  imports: [
    CommonModule,
    NzIconModule,
    NzButtonModule,
    NzAlertModule,
    NzInputModule,
    NzTableModule
  ],
  templateUrl: './talks.component.html',
  styleUrl: './talks.component.scss'
})
export class TalksComponent implements OnInit {
  adminService = inject(AdminService);
  route = inject(ActivatedRoute);
  router = inject(Router);

  isExporting = false;
  loading = false;

  listOfColumn: models.ColumnItem[] = [
    {
      title: 'Title',
      priority: false,
      sortable: false,
      width: '35%'
    },
    {
      title: 'Speakers',
      priority: false,
      sortable: false,
      width: '20%'
    },
    {
      title: 'Bookmarks',
      priority: false,
      sortable: true,
      sortDirections: ['ascend', 'descend', null],
      sortField: 'bookmarks',
      width: '15%'
    },
    {
      title: 'Ratings',
      priority: false,
      sortable: true,
      sortDirections: ['ascend', 'descend', null],
      sortField: 'rates',
      width: '15%'
    },
    {
      title: 'Average Rating',
      priority: false,
      sortable: true,
      sortDirections: ['ascend', 'descend', null],
      sortField: 'avg_rate',
      width: '15%'
    }
  ];

  listOfData: models.TalksDataItem[] = [];
  filteredData: models.TalksDataItem[] = [];
  searchTerm: string = '';

  currentSort: {
    field: string | null;
    order: NzTableSortOrder;
  } = {
    field: null,
    order: null
  };

  ngOnInit(): void {
    this.loadConferences();
  
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['search'] || '';
      const sortParam = params['sort'] || '';
  
      if (sortParam) {
        if (sortParam.startsWith('-')) {
          this.currentSort = {
            field: sortParam.substring(1),
            order: 'descend'
          };
        } else {
          this.currentSort = {
            field: sortParam,
            order: 'ascend'
          };
        }
      } else {
        this.currentSort = {
          field: null,
          order: null
        };
      }
  
      this.filterData();
    });
  }

  onQueryParamsChange(params: NzTableQueryParams): void {
    const { sort } = params;
    const currentSort = sort.find(item => item.value !== null);
  
    // Reset all other sorts
    if (currentSort) {
      const sortIndex = Number(currentSort.key);
      const column = this.listOfColumn[sortIndex];
  
      if (this.isSortableColumnItem(column)) {
        // Update current sort state
        this.currentSort = {
          field: column.sortField,
          order: currentSort.value
        };
  
        // Construct the sort parameter
        const sortValue = currentSort.value === 'ascend'
          ? column.sortField
          : currentSort.value === 'descend'
            ? `-${column.sortField}`
            : '';
  
        // Update URL with sort parameters
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { sort: sortValue || null },
          queryParamsHandling: 'merge'
        });
  
        this.loadConferences();
      }
    } else {
      // Reset sorting if no sort is active
      this.currentSort = {
        field: null,
        order: null
      };
  
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { sort: null },
        queryParamsHandling: 'merge'
      });
  
      this.loadConferences();
    }
  }
  
  isSortableColumnItem(item: models.ColumnItem | undefined): item is models.SortableColumnItem {
    return !!item && item.sortable === true;
  }

  onSortOrderChange(sortField: string, sortOrder: NzTableSortOrder): void {
    // Check if the sortOrder is already active on the same field
    if (this.currentSort.field === sortField && this.currentSort.order === sortOrder) {
      return;
    }
  
    // Update current sort state
    this.currentSort = {
      field: sortOrder ? sortField : null,
      order: sortOrder
    };
  
    // Construct the sort parameter
    const sortValue = sortOrder === 'ascend'
      ? sortField
      : sortOrder === 'descend'
        ? `-${sortField}`
        : null;
  
    // Update URL with the new sort parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: sortValue },
      queryParamsHandling: 'merge',
    });
  
    // Reload data with the new sorting applied
    this.loadConferences();
  }

  /** Load conferences from the service */
  loadConferences(): void {
    this.loading = true;
    this.adminService.getConferences(this.currentSort.field || undefined, this.currentSort.order)
    .subscribe({
      next: (data: models.TalksDataItem[]) => {
        this.listOfData = data;
        this.filterData();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading conferences', error);
        this.loading = false;
      }
    });
  }

  /** Filter data based on searchTerm */
  filterData(): void {
    if (this.searchTerm) {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredData = this.listOfData.filter(item =>
        item.title.toLowerCase().includes(searchTermLower) ||
        item.speakers.toLowerCase().includes(searchTermLower)
      );
    } else {
      this.filteredData = this.listOfData;
    }
  }

  exportTalksCsv(): void {
    this.isExporting = true;
    this.adminService.exportTalksCsv();
    setTimeout(() => this.isExporting = false, 1000);
  }
}
