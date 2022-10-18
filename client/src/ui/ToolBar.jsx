import { useTheme } from "@emotion/react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
	Divider,
	FormControl,
	FormHelperText,
	IconButton,
	MenuItem,
	Select,
	Toolbar,
	Typography
} from "@mui/material";
import MuiAppBar from "@mui/material/AppBar";
import MuiDrawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";
import { makeStyles } from "@mui/styles";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchExperiments, fetchMetadata } from "../actions";

const DRAWER_WIDTH = 240;

const useStyles = makeStyles((theme) => ({
	toolbar: {
		color: "black",
		backgroundColor: "white",
		justifyContent: "space-between"
	},
	formControl: {
		margin: 20,
		justifyContent: "flex-end",
		textColor: "white"
	}
}));

const openedMixin = (theme) => ({
	width: DRAWER_WIDTH,
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.enteringScreen
	}),
	overflowX: "hidden"
});

const closedMixin = (theme) => ({
	transition: theme.transitions.create("width", {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen
	}),
	overflowX: "hidden",
	width: `calc(${theme.spacing(0)} + 1px)`,
	[theme.breakpoints.up("sm")]: {
		width: `calc(${theme.spacing(0)} + 1px)`
	}
});

const DrawerHeader = styled("div")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "flex-end",
	// necessary for content to be below app bar
	...theme.mixins.toolbar
}));

const Drawer = styled(MuiDrawer, {
	shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
	width: DRAWER_WIDTH,
	flexShrink: 0,
	whiteSpace: "nowrap",
	boxSizing: "border-box",
	...(open && {
		...openedMixin(theme),
		"& .MuiDrawer-paper": openedMixin(theme)
	}),
	...(!open && {
		...closedMixin(theme),
		"& .MuiDrawer-paper": closedMixin(theme)
	})
}));

const AppBar = styled(MuiAppBar, {
	shouldForwardProp: (prop) => prop !== "open"
})(({ theme, open }) => ({
	zIndex: theme.zIndex.drawer + 1,
	transition: theme.transitions.create(["width", "margin"], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen
	}),
	...(open && {
		marginLeft: DRAWER_WIDTH,
		width: `calc(100% - ${DRAWER_WIDTH}px)`,
		transition: theme.transitions.create(["width", "margin"], {
			easing: theme.transitions.easing.sharp,
			duration: theme.transitions.duration.enteringScreen
		})
	})
}));

export default function ToolBar(props) {
	const theme = useTheme();
	const classes = useStyles();
	const dispatch = useDispatch();
	const experiments = useSelector((store) => store.experiments);
	const selectedExperiment = useSelector((store) => store.selectedExperiment);
	const dataDir = useSelector((store) => store.dataDir);
	const [open, setOpen] = useState(false);

	const handleDrawerOpen = () => {
		setOpen(true);
	};

	const handleDrawerClose = () => {
		setOpen(false);
	};

	useEffect(() => {
		dispatch(fetchExperiments());
	}, []);

	// useEffect(() => {
	// 	if (selectedExperiment !== "") {
	// 		dispatch(fetchMetadata(selectedExperiment));
	// 	}
	// }, [selectedExperiment]);

	return (
		<>
			<AppBar open={open} elevation={1} position="absolute">
				<Toolbar className={classes.toolbar}>
					{/* <IconButton
						color="inherit"
						aria-label="open drawer"
						onClick={handleDrawerOpen}
						edge="start"
						sx={{
							marginRight: "36px",
							...(open && { display: "none" }),
						}}
					>
						<MenuIcon />
					</IconButton> */}
					<Typography variant="h5" noWrap component="div">
						Data Movement VISualized!
					</Typography>
					<Typography variant="subtitle1" noWrap component="div">
						Found <strong>{experiments.length}</strong> profiles in{" "}
						<span style={{ color: "#00adb5" }}>{dataDir}</span>
					</Typography>
					{props.withDropdown && selectedExperiment != "" && experiments.length > 0 ? (
						<FormControl
							className={classes.formControl}
							size="small"
							margin="dense"
						>
							<Select
								labelId="dataset-label"
								id="dataset-select"
								value={selectedExperiment}
								onChange={(e) => {
									dispatch(fetchMetadata(e.target.value));
								}}
							>
								{experiments.map((cc) => (
									<MenuItem key={cc} value={cc}>
										{cc}
									</MenuItem>
								))}
							</Select>
							<FormHelperText>
								<span
									style={{
										color: "#00adb5",
										fontSize: theme.text.fontSize
									}}
								>
									Select the profile
								</span>
							</FormHelperText>
						</FormControl>
					) : (
						<></>
					)}
				</Toolbar>
			</AppBar>
			<Drawer variant="permanent" open={open}>
				<DrawerHeader>
					<IconButton onClick={handleDrawerClose}>
						{theme.direction === "rtl" ? (
							<ChevronRightIcon />
						) : (
							<ChevronLeftIcon />
						)}
					</IconButton>
				</DrawerHeader>
				<Divider />
			</Drawer>
		</>
	);
}
