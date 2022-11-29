import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// import { fetchHostDeviceComm } from "../actions";
import D3ChordDiagram from "../ui/d3-chord-diagram";
import D3Matrix from "../ui/d3-matrix";

export default function DeviceDeviceCommunication() {
	const style = {
		top: 10,
		right: 40,
		bottom: 10,
		left: 20,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3 - 20
	};
	const containerID = useRef("host-device-view");

	const [matrixType, setMatrixType] = useState("matrix");

	// setMatrixType("matrix");

	// create a matrix
	const matrixData = [
		[0, 0, 8916, 2868],
		[1951, 0, 2060, 6171]
	];

	// useEffect(() => {
	// 	if (selectedExperiment !== "") {
	// 		let groups = timelineSummary.map((d) => d.group);
	// 		dispatch(fetchEventSummary(groups));
	// 	}
	// }, [selectedExperiment]);

	return (
		<Grid container>
			{matrixData.length > 0 && matrixData[0].length > 0 ? (
				<Card style={{ borderColor: "gray" }}>
					{matrixType == "chord" ? (
						<D3ChordDiagram
							containerName={containerID.current}
							style={style}
							data={matrixData}
						/>
					) : (
						<D3Matrix
							containerName={containerID.current}
							style={style}
							data={matrixData}
						/>
					)}
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
