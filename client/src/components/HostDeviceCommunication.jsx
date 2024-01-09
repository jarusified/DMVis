import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import React, { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// import { fetchHostDeviceComm } from "../actions";
import D3ChordDiagram from "../ui/d3-chord-diagram";
import D3Matrix from "../ui/d3-matrix";

export default function HostDeviceCommunication() {
	const style = {
		left: 36,
		right: 0,
		top: 36,
		bottom: 0,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3 - 20
	};
	const containerID = useRef("host-device-view");

	const [matrixType, setMatrixType] = useState("matrix");

	// setMatrixType("matrix");

	// create a matrix
	// const matrixData = [
	// 	[0,  0, 8916, 2868],
	// 	[ 1951, 0, 2060, 6171],
	// 	[ 8010, 16145, 0, 8045],
	// 	[ 1013,   990,  940, 0],
	// 	[0,  0, 8916, 2868],
	// 	[ 1951, 0, 2060, 6171],
	// 	[ 8010, 16145, 0, 8045],
	// 	[ 1013,   990,  940, 0],
	// 	[0,  0, 8916, 2868],
	// 	[ 1951, 0, 2060, 6171],
	// 	[ 8010, 16145, 0, 8045],
	// 	[ 1013,   990,  940, 0]
	// ];

	const matrixData = [
		[0, 40960, 40960, 40960],
		[30720, 0, 1024, 1024],
		[30720, 30720, 0, 1024],
		[1024, 1024, 1024, 0],
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
							matrixData={matrixData}
						/>
					)}
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);
}
