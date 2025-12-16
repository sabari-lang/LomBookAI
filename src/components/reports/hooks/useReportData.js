import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { extractItems } from "../../../utils/extractItems";
import { extractPagination } from "../../../utils/extractPagination";

export const useReportData = ({
    queryKeyBase,
    fetcher,
    enabled = true,
    initialPage = 1,
    initialPerPage = 25,
    extraParams,
    extraParamsDeps = [],
    extraKey = [],
    options = {},
}) => {
    const [page, setPage] = useState(initialPage);
    const [perPage, setPerPage] = useState(initialPerPage);

    const computedExtraParams = useMemo(
        () => {
            if (typeof extraParams === "function") return extraParams() ?? {};
            return extraParams ?? {};
        },
        [extraParams, extraParamsDeps]
    );

    const queryKey = useMemo(
        () => [...queryKeyBase, ...extraKey, page, perPage],
        [queryKeyBase, extraKey, page, perPage]
    );

    const query = useQuery({
        queryKey,
        queryFn: () =>
            fetcher({
                Page: page,
                PageSize: perPage,
                ...computedExtraParams,
            }),
        enabled: Boolean(enabled),
        keepPreviousData: true,
        retry: 1,
        ...options,
    });

    const rows = useMemo(() => {
        const items = extractItems(query.data);
        return items.map((row, index) => ({
            ...row,
            id: row.id ?? row.transactionId ?? index + 1,
        }));
    }, [query.data]);

    const pagination = extractPagination(query.data);
    const totalRows = Number.isFinite(pagination.totalCount)
        ? pagination.totalCount
        : rows.length;

    return {
        ...query,
        rows,
        pagination,
        totalRows,
        page,
        perPage,
        setPage,
        setPerPage,
    };
};
