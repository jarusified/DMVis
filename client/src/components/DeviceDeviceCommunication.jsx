import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import React, { useRef, useState } from "react";

import D3ChordDiagram from "../ui/d3-chord-diagram";
import D3Matrix from "../ui/d3-matrix";

export default function DeviceDeviceCommunication() {
	const style = {
		top: 36,
		right: 0,
		bottom: 0,
		left: 36,
		width: window.innerWidth / 4,
		height: window.innerHeight / 4
	};
	const containerID = useRef("device-device-view");

	const [matrixType, setMatrixType] = useState("matrix");

	// setMatrixType("matrix");

	// create a matrix
	const matrixData = [
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
		[0, 0, 0, 0],
	];

	console.log(matrixData);

	// useEffect(() => {
	// 	if (selectedExperiment !== "") {
	// 		let groups = timelineSummary.map((d) => d.group);
	// 		dispatch(fetchEventSummary(groups));
	// 	}
	// }, [selectedExperiment]);

	return (
		<Grid container>
			{matrixData.length > 0 && matrixData[0].length > 0 ? (
				<Card>
					<D3Matrix
						containerName={containerID.current}
						style={style}
						matrixDatata={matrixData}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
