import React, { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// import { fetchHostDeviceComm } from "../actions";
import D3ChordDiagram from "../ui/d3-chord-diagram";

export default function HostDeviceCommunication() {
	const dispatch = useDispatch();

	const style = {
		top: 10,
		right: 40,
		bottom: 10,
		left: 20,
		width: window.innerWidth / 3 - 30,
		height: window.innerHeight / 3 - 50
	};
	const containerID = useRef("host-device-view");


	// create a matrix
	const matrixData = [
		[0,  0, 8916, 2868],
		[ 1951, 0, 2060, 6171],
		[ 8010, 16145, 0, 8045],
		[ 1013,   990,  940, 0]
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
					<D3ChordDiagram
						containerName={containerID.current}
						style={style}
						data={matrixData}
					/>
				</Card>
			) : (
				<CircularProgress />
			)}
		</Grid>
	);

	return <div id={containerID.current}></div>;
}
