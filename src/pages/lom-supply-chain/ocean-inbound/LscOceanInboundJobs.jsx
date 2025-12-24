import React, { useState } from "react";
import JobList from "../../../components/lom-supply-chain/ocean-inbound/JobList";
import JobModal from "../../../components/lom-supply-chain/ocean-inbound/JobModal";

const LscOceanInboundJobs = () => {
    const [editData, setEditData] = useState(null);

    const handleAdd = () => {
        setEditData(null);
    };

    const handleEdit = (row) => {
        setEditData(row ?? {});
    };

    return (
        <>
            <JobList 
                onAdd={handleAdd} 
                onEdit={handleEdit} 
            />
            <JobModal
                editData={editData ?? {}}
                setEditData={setEditData}
            />
        </>
    );
};

export default LscOceanInboundJobs;

