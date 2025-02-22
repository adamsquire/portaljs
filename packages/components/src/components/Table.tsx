import {
  createColumnHelper,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/solid';

import React, { useEffect, useMemo, useState } from 'react';

import parseCsv from '../lib/parseCsv';
import DebouncedInput from './DebouncedInput';
import loadData from '../lib/loadData';
import LoadingSpinner from './LoadingSpinner';

export type TableProps = {
  data?: Array<{ [key: string]: number | string }>;
  cols?: Array<{ [key: string]: string }>;
  csv?: string;
  url?: string;
  fullWidth?: boolean;
};

export const Table = ({
  data: ogData = [],
  cols: ogCols = [],
  csv = '',
  url = '',
  fullWidth = false,
}: TableProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (csv) {
    const out = parseCsv(csv);
    ogData = out.rows;
    ogCols = out.fields;
  }

  const [data, setData] = React.useState(ogData);
  const [cols, setCols] = React.useState(ogCols);
  // const [error, setError] = React.useState(""); //  TODO: add error handling

  const tableCols = useMemo(() => {
    const columnHelper = createColumnHelper();
    return cols.map((c) =>
      columnHelper.accessor<any, string>(c.key, {
        header: () => c.name,
        cell: (info) => info.getValue(),
      })
    );
  }, [data, cols]);

  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns: tableCols,
    getCoreRowModel: getCoreRowModel(),
    state: {
      globalFilter,
    },
    globalFilterFn: globalFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    if (url) {
      setIsLoading(true);
      //  TODO: exception handling. What if the file doesn't exist? What if fetching was not possible?
      loadData(url).then((data) => {
        const { rows, fields } = parseCsv(data);
        setData(rows);
        setCols(fields);
        setIsLoading(false);
      });
    }
  }, [url]);

  return isLoading ? (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center">
      <LoadingSpinner />
    </div>
  ) : (
    <div className={`${fullWidth ? 'w-[90vw] ml-[calc(50%-45vw)]' : 'w-full'}`}>
      <DebouncedInput
        value={globalFilter ?? ''}
        onChange={(value: any) => setGlobalFilter(String(value))}
        className="p-2 text-sm shadow border border-block"
        placeholder="Search all columns..."
      />
      <table className="w-full mt-10">
        <thead className="text-left border-b border-b-slate-300">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="pr-2 pb-2">
                  <div
                    {...{
                      className: h.column.getCanSort()
                        ? 'cursor-pointer select-none'
                        : '',
                      onClick: h.column.getToggleSortingHandler(),
                    }}
                  >
                    {flexRender(h.column.columnDef.header, h.getContext())}
                    {{
                      asc: (
                        <ArrowUpIcon className="inline-block ml-2 h-4 w-4" />
                      ),
                      desc: (
                        <ArrowDownIcon className="inline-block ml-2 h-4 w-4" />
                      ),
                    }[h.column.getIsSorted() as string] ?? (
                      <div className="inline-block ml-2 h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((r) => (
            <tr key={r.id} className="border-b border-b-slate-200">
              {r.getVisibleCells().map((c) => (
                <td key={c.id} className="py-2">
                  {flexRender(c.column.columnDef.cell, c.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2 items-center justify-center mt-10">
        <button
          className={`w-6 h-6 ${
            !table.getCanPreviousPage() ? 'opacity-25' : 'opacity-100'
          }`}
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronDoubleLeftIcon />
        </button>
        <button
          className={`w-6 h-6 ${
            !table.getCanPreviousPage() ? 'opacity-25' : 'opacity-100'
          }`}
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeftIcon />
        </button>
        <span className="flex items-center gap-1">
          <div>Page</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </strong>
        </span>
        <button
          className={`w-6 h-6 ${
            !table.getCanNextPage() ? 'opacity-25' : 'opacity-100'
          }`}
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRightIcon />
        </button>
        <button
          className={`w-6 h-6 ${
            !table.getCanNextPage() ? 'opacity-25' : 'opacity-100'
          }`}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronDoubleRightIcon />
        </button>
      </div>
    </div>
  );
};

const globalFilterFn: FilterFn<any> = (row, columnId, filterValue: string) => {
  const search = filterValue.toLowerCase();

  let value = row.getValue(columnId) as string;
  if (typeof value === 'number') value = String(value);

  return value?.toLowerCase().includes(search);
};
